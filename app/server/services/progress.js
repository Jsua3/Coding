import { query } from "../db.js";

export function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function courseStatus({ progress, prereqProgress = null }) {
  if (prereqProgress !== null && prereqProgress < 100) return "BLOQUEADO";
  if (progress >= 100) return "COMPLETADO";
  if (progress > 0) return "EN CURSO";
  return "NUEVO";
}

async function courseStats(userId) {
  const rows = await query(
    `SELECT c.id AS course_id,
            COUNT(l.id) AS total,
            COUNT(lc.lesson_id) AS completed,
            SUM(l.mins) AS mins,
            MAX(lc.completed_at) AS last_activity
     FROM courses c
     JOIN units u ON u.course_id = c.id
     JOIN lessons l ON l.unit_id = u.id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     GROUP BY c.id`,
    [userId]
  );
  const map = {};
  for (const r of rows) {
    map[r.course_id] = {
      total: Number(r.total),
      completed: Number(r.completed),
      mins: Number(r.mins || 0),
      lastActivity: r.last_activity,
    };
  }
  return map;
}

export async function coursesForUser(userId) {
  const stats = await courseStats(userId);
  const courses = await query("SELECT * FROM courses ORDER BY order_index");
  return courses.map((c) => {
    const s = stats[c.id] || { total: 0, completed: 0, mins: 0 };
    const progress = progressPercent(s.completed, s.total);
    const prereq = c.prereq_course_id ? stats[c.prereq_course_id] : null;
    const prereqProgress = prereq ? progressPercent(prereq.completed, prereq.total) : null;
    return {
      id: c.id,
      subject: c.subject,
      subjectTone: c.subject_tone,
      title: c.title,
      description: c.description,
      lessons: s.total,
      hours: Math.round(s.mins / 60),
      progress,
      status: courseStatus({ progress, prereqProgress }),
      prereqId: c.prereq_course_id,
    };
  });
}

export async function courseDetail(userId, courseId) {
  const list = await coursesForUser(userId);
  const course = list.find((c) => c.id === courseId);
  if (!course) return null;
  if (course.status === "BLOQUEADO") {
    const prereq = list.find((c) => c.id === course.prereqId);
    const err = new Error(`Completa ${prereq.subject} para desbloquear esta materia`);
    err.status = 403;
    throw err;
  }
  const rows = await query(
    `SELECT u.id AS unit_id, u.name AS unit_name,
            l.id, l.title, l.mins,
            (lc.lesson_id IS NOT NULL) AS done
     FROM units u
     JOIN lessons l ON l.unit_id = u.id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     WHERE u.course_id = ?
     ORDER BY u.order_index, l.order_index`,
    [userId, courseId]
  );
  const units = [];
  let currentAssigned = false;
  for (const r of rows) {
    let unit = units[units.length - 1];
    if (!unit || unit.id !== r.unit_id) {
      unit = { id: r.unit_id, name: r.unit_name, lessons: [] };
      units.push(unit);
    }
    const done = Boolean(r.done);
    const current = !done && !currentAssigned;
    if (current) currentAssigned = true;
    unit.lessons.push({ id: r.id, title: r.title, mins: r.mins, done, current });
  }
  return { ...course, units };
}

export async function findContinue(userId) {
  const list = await coursesForUser(userId);
  const recent = await query(
    `SELECT u.course_id, MAX(lc.completed_at) AS last_at
     FROM lesson_completions lc
     JOIN lessons l ON l.id = lc.lesson_id
     JOIN units u ON u.id = l.unit_id
     WHERE lc.user_id = ?
     GROUP BY u.course_id
     ORDER BY last_at DESC
     LIMIT 1`,
    [userId]
  );
  let course = null;
  if (recent.length) {
    const c = list.find((x) => x.id === recent[0].course_id);
    if (c && c.status !== "BLOQUEADO" && c.progress < 100) course = c;
  }
  if (!course) course = list.find((c) => c.status !== "BLOQUEADO" && c.progress < 100) || null;
  if (!course) return null;
  const next = await query(
    `SELECT l.id, l.title
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     WHERE u.course_id = ? AND lc.lesson_id IS NULL
     ORDER BY u.order_index, l.order_index
     LIMIT 1`,
    [userId, course.id]
  );
  if (!next.length) return null;
  return { courseId: course.id, lessonId: next[0].id, lessonTitle: next[0].title };
}
