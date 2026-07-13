import { query } from "../db.js";

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

const PENDING_HAVING = `HAVING last_wrong IS NOT NULL AND (last_review_ok IS NULL OR last_review_ok < last_wrong)`;

export async function isPendingReview(userId, exerciseId) {
  const rows = await query(
    `SELECT
       MAX(CASE WHEN correct = 0 THEN id END) AS last_wrong,
       MAX(CASE WHEN correct = 1 AND context = 'review' THEN id END) AS last_review_ok
     FROM answer_attempts
     WHERE user_id = ? AND exercise_id = ?`,
    [userId, exerciseId]
  );
  const r = rows[0];
  return Boolean(r && r.last_wrong && (!r.last_review_ok || r.last_review_ok < r.last_wrong));
}

export async function pendingReview(userId, limit = 10) {
  const rows = await query(
    `SELECT e.id, e.type, e.prompt, e.payload, l.title AS lesson_title, c.subject AS course_subject,
            MAX(CASE WHEN a.correct = 0 THEN a.id END) AS last_wrong,
            MAX(CASE WHEN a.correct = 1 AND a.context = 'review' THEN a.id END) AS last_review_ok
     FROM answer_attempts a
     JOIN exercises e ON e.id = a.exercise_id
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     JOIN courses c ON c.id = u.course_id
     WHERE a.user_id = ?
     GROUP BY e.id, e.type, e.prompt, e.payload, l.title, c.subject
     ${PENDING_HAVING}
     ORDER BY last_wrong DESC
     LIMIT ${Number(limit)}`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    prompt: r.prompt,
    payload: parseMaybe(r.payload),
    lessonTitle: r.lesson_title,
    courseSubject: r.course_subject,
  }));
}

export async function reviewCount(userId) {
  const rows = await query(
    `SELECT COUNT(*) AS n FROM (
       SELECT a.exercise_id,
              MAX(CASE WHEN a.correct = 0 THEN a.id END) AS last_wrong,
              MAX(CASE WHEN a.correct = 1 AND a.context = 'review' THEN a.id END) AS last_review_ok
       FROM answer_attempts a
       WHERE a.user_id = ?
       GROUP BY a.exercise_id
       ${PENDING_HAVING}
     ) pendientes`,
    [userId]
  );
  return Number(rows[0].n);
}
