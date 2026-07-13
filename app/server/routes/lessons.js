import { Router } from "express";
import { query, getPool } from "../db.js";
import { courseDetail } from "../services/progress.js";

const router = Router();

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

async function loadLesson(lessonId) {
  const rows = await query(
    `SELECT l.id, l.title, l.mins, l.content, u.name AS unit_name, u.course_id, c.subject AS course_subject
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     JOIN courses c ON c.id = u.course_id
     WHERE l.id = ?`,
    [lessonId]
  );
  return rows[0] || null;
}

router.get("/:id", async (req, res, next) => {
  try {
    const lesson = await loadLesson(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Esta lección no existe" });
    const detail = await courseDetail(req.userId, lesson.course_id); // 403 si bloqueado
    const all = detail.units.flatMap((u) => u.lessons);
    const index = all.findIndex((l) => l.id === lesson.id);
    const [quiz] = await query("SELECT question, options FROM quiz_questions WHERE lesson_id = ?", [lesson.id]);
    res.json({
      id: lesson.id,
      title: lesson.title,
      unitName: lesson.unit_name,
      courseId: lesson.course_id,
      courseSubject: lesson.course_subject,
      position: { index: index + 1, total: all.length },
      courseProgress: detail.progress,
      content: parseMaybe(lesson.content),
      quiz: quiz ? { question: quiz.question, options: parseMaybe(quiz.options) } : null,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/answer", async (req, res, next) => {
  try {
    const lesson = await loadLesson(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Esta lección no existe" });
    await courseDetail(req.userId, lesson.course_id); // 403 si bloqueado

    const [q] = await query("SELECT * FROM quiz_questions WHERE lesson_id = ?", [lesson.id]);
    if (!q) return res.status(404).json({ error: "Esta lección no tiene quiz" });
    const options = parseMaybe(q.options);
    const { answerIndex } = req.body || {};
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
      return res.status(400).json({ error: "Selecciona una opción válida" });
    }

    const correct = answerIndex === q.correct_index;
    let xpAwarded = 0;
    let alreadyCompleted = false;
    if (correct) {
      const existing = await query(
        "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?",
        [req.userId, lesson.id]
      );
      alreadyCompleted = existing.length > 0;
      if (!alreadyCompleted) {
        const conn = await getPool().getConnection();
        try {
          await conn.beginTransaction();
          await conn.query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)", [req.userId, lesson.id]);
          await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 50)", [req.userId, lesson.id]);
          await conn.commit();
          xpAwarded = 50;
        } catch (e) {
          await conn.rollback();
          if (e && e.code === "ER_DUP_ENTRY") {
            alreadyCompleted = true;
          } else {
            throw e;
          }
        } finally {
          conn.release();
        }
      }
    }

    const detail = await courseDetail(req.userId, lesson.course_id);
    const all = detail.units.flatMap((u) => u.lessons);
    const index = all.findIndex((l) => l.id === lesson.id);
    const nextLesson = all[index + 1] || null;

    res.json({
      correct,
      explanation: correct ? q.explain_ok : q.explain_bad,
      xpAwarded,
      alreadyCompleted,
      courseProgress: detail.progress,
      nextLessonId: nextLesson ? nextLesson.id : null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
