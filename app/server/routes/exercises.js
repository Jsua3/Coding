import { Router } from "express";
import { query, getPool } from "../db.js";
import { courseDetail } from "../services/progress.js";
import { validateResponse } from "../services/exercises.js";
import { currentStreak, toDayString } from "../services/gamification.js";
import { isPendingReview } from "../services/review.js";
import { XP_LESSON, XP_PERFECT, XP_REVIEW } from "../services/xp.js";
import { unlockedIds } from "../services/metagame.js";
import { achievementInfo } from "../services/achievements.js";

const router = Router();

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

async function loadExercise(id) {
  const rows = await query(
    `SELECT e.*, u.course_id
     FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
}

router.post("/:id/answer", async (req, res, next) => {
  try {
    const ex = await loadExercise(req.params.id);
    if (!ex) return res.status(404).json({ error: "Este ejercicio no existe" });
    await courseDetail(req.userId, ex.course_id); // lanza 403 si el curso está bloqueado

    const { valid, correct } = validateResponse(
      ex.type,
      parseMaybe(ex.payload),
      parseMaybe(ex.answer),
      req.body && req.body.response
    );
    if (!valid) return res.status(400).json({ error: "Tu respuesta no tiene el formato esperado" });

    // El conjunto ANTES de tocar nada. Solo hace falta si la respuesta es correcta: los contadores
    // de los logros son monótonos y ninguno crece al fallar, así que una respuesta incorrecta no
    // puede desbloquear nada. Va antes del INSERT del intento porque "resucitado" mira los intentos.
    const antes = correct ? await unlockedIds(req.userId) : null;

    const context = req.body && req.body.context === "review" ? "review" : "lesson";
    let reviewCleared = false;
    if (context === "review" && correct) {
      reviewCleared = await isPendingReview(req.userId, ex.id);
    }

    await query(
      "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, ?, ?)",
      [req.userId, ex.id, context, correct ? 1 : 0]
    );

    let lessonCompleted = false;
    let xpAwarded = 0;
    let perfectBonus = 0;
    let streak = null;

    if (reviewCleared) {
      await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_REVIEW]);
      xpAwarded = XP_REVIEW;
    }

    if (context === "lesson" && correct) {
      const done = await query(
        "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?",
        [req.userId, ex.lesson_id]
      );
      if (!done.length) {
        const remaining = await query(
          `SELECT e.id FROM exercises e
           LEFT JOIN answer_attempts a ON a.exercise_id = e.id AND a.user_id = ? AND a.correct = 1
           WHERE e.lesson_id = ? AND a.id IS NULL`,
          [req.userId, ex.lesson_id]
        );
        if (!remaining.length) {
          const fails = await query(
            `SELECT a.id FROM answer_attempts a
             JOIN exercises e ON e.id = a.exercise_id
             WHERE a.user_id = ? AND e.lesson_id = ? AND a.context = 'lesson' AND a.correct = 0
             LIMIT 1`,
            [req.userId, ex.lesson_id]
          );
          const perfect = fails.length === 0;
          const prevDays = (
            await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId])
          ).map((r) => toDayString(r.completed_at));
          const hadToday = prevDays.includes(toDayString(new Date()));
          const conn = await getPool().getConnection();
          try {
            await conn.beginTransaction();
            await conn.query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)", [req.userId, ex.lesson_id]);
            await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_LESSON]);
            if (perfect) {
              await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_PERFECT]);
            }
            await conn.commit();
            lessonCompleted = true;
            xpAwarded = XP_LESSON;
            perfectBonus = perfect ? XP_PERFECT : 0;
          } catch (e) {
            await conn.rollback();
            if (!(e && e.code === "ER_DUP_ENTRY")) throw e;
          } finally {
            conn.release();
          }
          if (lessonCompleted) {
            const rows = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId]);
            const days = rows.map((r) => toDayString(r.completed_at));
            streak = { value: currentStreak(days, toDayString(new Date())), extended: !hadToday };
          }
        }
      }
    }

    const detail = await courseDetail(req.userId, ex.course_id);
    const all = detail.units.flatMap((u) => u.lessons);
    const idx = all.findIndex((l) => l.id === ex.lesson_id);
    const nextLesson = lessonCompleted && all[idx + 1] ? all[idx + 1].id : null;

    let achievementsUnlocked = [];
    if (antes) {
      try {
        const despues = await unlockedIds(req.userId);
        achievementsUnlocked = [...despues]
          .filter((id) => !antes.has(id))
          .map(achievementInfo)
          .filter(Boolean);
      } catch (e) {
        // El toast es ceremonia, no registro. Si el cálculo falla, el usuario conserva su XP y su
        // lección completada (ya están confirmados en la BD) y el logro sigue estando en Progreso.
        // Tirar la respuesta entera por no poder celebrar sería el peor de los dos males.
        console.error("No se pudieron calcular los logros desbloqueados:", e);
      }
    }

    res.json({
      correct,
      explanation: correct ? ex.explain_ok : ex.explain_bad,
      lessonCompleted,
      xpAwarded,
      perfectBonus,
      streak,
      courseProgress: detail.progress,
      nextLessonId: nextLesson,
      reviewCleared,
      achievementsUnlocked,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
