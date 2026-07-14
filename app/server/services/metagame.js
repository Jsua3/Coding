import { query } from "../db.js";
import { toDayString, bestStreak } from "./gamification.js";
import { XP_PERFECT, XP_REVIEW } from "./xp.js";
import { coursesForUser } from "./progress.js";
import { unlockedFor } from "./achievements.js";

// Los contadores de los que dependen los logros. TODOS son monótonos (solo crecen), y por eso es
// seguro derivar los logros en vez de guardarlos: el conjunto de desbloqueados nunca encoge.
export async function achievementStats(userId) {
  const completions = await query(
    "SELECT lesson_id, completed_at FROM lesson_completions WHERE user_id = ? ORDER BY completed_at",
    [userId]
  );
  const events = await query("SELECT lesson_id, amount FROM xp_events WHERE user_id = ?", [userId]);
  const courses = await coursesForUser(userId);

  // "Perfecta" y "repaso corregido" se derivan del IMPORTE del evento — por eso los importes viven
  // en services/xp.js y se usan también al escribirlos.
  const perfectIds = new Set(
    events.filter((e) => e.amount === XP_PERFECT && e.lesson_id).map((e) => e.lesson_id)
  );

  // Racha máxima de lecciones perfectas consecutivas, por orden de completado.
  let run = 0;
  let perfectRun = 0;
  for (const c of completions) {
    run = perfectIds.has(c.lesson_id) ? run + 1 : 0;
    if (run > perfectRun) perfectRun = run;
  }

  const hours = completions.map((c) => new Date(c.completed_at).getHours());

  // ¿Algún ejercicio con 3+ fallos y, después, un acierto EN REPASO?
  const [res] = await query(
    `SELECT COUNT(*) AS n FROM (
       SELECT a.exercise_id
       FROM answer_attempts a
       WHERE a.user_id = ?
       GROUP BY a.exercise_id
       HAVING SUM(a.correct = 0) >= 3 AND SUM(a.context = 'review' AND a.correct = 1) >= 1
     ) t`,
    [userId]
  );

  return {
    lessonsDone: completions.length,
    bestStreak: bestStreak(completions.map((c) => toDayString(c.completed_at))),
    perfectLessons: perfectIds.size,
    coursesCompleted: courses.filter((c) => c.status === "COMPLETADO").length,
    reviewCleared: events.filter((e) => e.amount === XP_REVIEW).length,
    // Disjuntos a propósito: el que se levanta temprano y el que aún no se ha acostado.
    earlyBird: hours.some((h) => h >= 5 && h < 7),
    nightOwl: hours.some((h) => h < 5),
    resurrected: Number(res.n) > 0,
    perfectRun,
  };
}

export async function unlockedIds(userId) {
  return unlockedFor(await achievementStats(userId));
}

// Lecciones y XP agrupados por día, en una sola pasada.
export async function activityByDay(userId) {
  const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [userId]);
  const events = await query("SELECT amount, created_at FROM xp_events WHERE user_id = ?", [userId]);
  const byDay = new Map();
  const cell = (day) => {
    if (!byDay.has(day)) byDay.set(day, { lessons: 0, xp: 0 });
    return byDay.get(day);
  };
  for (const c of completions) cell(toDayString(c.completed_at)).lessons += 1;
  for (const e of events) cell(toDayString(e.created_at)).xp += e.amount;
  return byDay;
}

// PURA. Incluye los días vacíos para que el frontend no tenga que rellenar huecos.
export function heatmapFrom(byDay, days, today) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = toDayString(d);
    const cell = byDay.get(day) || { lessons: 0, xp: 0 };
    out.push({ day, lessons: cell.lessons, xp: cell.xp });
  }
  return out;
}

// PURA.
export function weekXpFrom(byDay, today) {
  return heatmapFrom(byDay, 7, today).map((c) => ({ day: c.day, xp: c.xp }));
}
