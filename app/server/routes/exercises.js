import { Router } from "express";
import { query, getPool } from "../db.js";
import { courseDetail } from "../services/progress.js";
import { validateResponse } from "../services/exercises.js";
import { currentStreak, toDayString } from "../services/gamification.js";

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

    await query(
      "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, 'lesson', ?)",
      [req.userId, ex.id, correct ? 1 : 0]
    );

    let lessonCompleted = false;
    let xpAwarded = 0;
    let perfectBonus = 0;
    let streak = null;

    if (correct) {
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
          const todayDone = await query(
            "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND DATE(completed_at) = CURDATE() LIMIT 1",
            [req.userId]
          );
          const conn = await getPool().getConnection();
          try {
            await conn.beginTransaction();
            await conn.query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)", [req.userId, ex.lesson_id]);
            await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 50)", [req.userId, ex.lesson_id]);
            if (perfect) {
              await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 10)", [req.userId, ex.lesson_id]);
            }
            await conn.commit();
            lessonCompleted = true;
            xpAwarded = 50;
            perfectBonus = perfect ? 10 : 0;
          } catch (e) {
            await conn.rollback();
            if (!(e && e.code === "ER_DUP_ENTRY")) throw e;
          } finally {
            conn.release();
          }
          if (lessonCompleted) {
            const rows = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId]);
            const days = rows.map((r) => toDayString(r.completed_at));
            streak = { value: currentStreak(days, toDayString(new Date())), extended: todayDone.length === 0 };
          }
        }
      }
    }

    const detail = await courseDetail(req.userId, ex.course_id);
    const all = detail.units.flatMap((u) => u.lessons);
    const idx = all.findIndex((l) => l.id === ex.lesson_id);
    const nextLesson = lessonCompleted && all[idx + 1] ? all[idx + 1].id : null;

    res.json({
      correct,
      explanation: correct ? ex.explain_ok : ex.explain_bad,
      lessonCompleted,
      xpAwarded,
      perfectBonus,
      streak,
      courseProgress: detail.progress,
      nextLessonId: nextLesson,
      reviewCleared: false,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
