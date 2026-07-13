import { Router } from "express";
import { query } from "../db.js";
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
    const exercises = await query(
      "SELECT id, type, prompt, payload FROM exercises WHERE lesson_id = ? ORDER BY order_index",
      [lesson.id]
    );
    res.json({
      id: lesson.id,
      title: lesson.title,
      unitName: lesson.unit_name,
      courseId: lesson.course_id,
      courseSubject: lesson.course_subject,
      position: { index: index + 1, total: all.length },
      courseProgress: detail.progress,
      content: parseMaybe(lesson.content),
      exercises: exercises.map((e) => ({ id: e.id, type: e.type, prompt: e.prompt, payload: parseMaybe(e.payload) })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
