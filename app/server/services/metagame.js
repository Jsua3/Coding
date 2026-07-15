import { query } from "../db.js";
import { toDayString, bestStreak } from "./gamification.js";
import { XP_PERFECT, XP_REVIEW } from "./xp.js";
import { coursesForUser } from "./progress.js";
import { unlockedFor } from "./achievements.js";
import { protectedDaysFor } from "./streak.js";

// Los contadores de los que dependen los logros. TODOS son monótonos (solo crecen), y por eso es
// seguro derivar los logros en vez de guardarlos: el conjunto de desbloqueados nunca encoge.
export async function achievementStats(userId) {
  // Desempate por lesson_id: completed_at es DATETIME (precisión de segundo), así que dos lecciones
  // del mismo segundo tendrían orden no determinista — y perfectRun depende del orden.
  // OJO: este es el único contador que no es estrictamente monótono. `completed_at` es un DATETIME
  // de precisión de segundo y `lesson_completions` no tiene id autoincremental (su PK es
  // (user_id, lesson_id)), así que no hay clave de orden de inserción. El desempate por `lesson_id`
  // da determinismo, no cronología: tres lecciones completadas dentro del mismo segundo, con una
  // imperfecta cuyo id ordene ENTRE dos perfectas, convertirían una racha de 2 en una de 1.
  // Es prácticamente inalcanzable (cada completación son varios viajes HTTP) y solo afecta al
  // secreto `impecable`. Cerrarlo exige una columna de orden en el esquema: la Iteración B, que sí
  // toca el esquema, es el sitio.
  const completions = await query(
    "SELECT lesson_id, completed_at FROM lesson_completions WHERE user_id = ? ORDER BY completed_at, lesson_id",
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

  // ¿Algún acierto EN REPASO que llegara DESPUÉS de al menos 3 fallos de ese mismo ejercicio?
  // El orden se deriva del id del intento, nunca del timestamp (regla del proyecto): un acierto
  // registrado antes de los fallos no es una resurrección, es lo contrario.
  const [res] = await query(
    `SELECT COUNT(*) AS n FROM (
       SELECT r.id
       FROM answer_attempts r
       WHERE r.user_id = ? AND r.context = 'review' AND r.correct = 1
         AND (
           SELECT COUNT(*) FROM answer_attempts f
           WHERE f.user_id = r.user_id AND f.exercise_id = r.exercise_id
             AND f.correct = 0 AND f.id < r.id
         ) >= 3
       LIMIT 1
     ) t`,
    [userId]
  );

  return {
    lessonsDone: completions.length,
    bestStreak: bestStreak([...completions.map((c) => toDayString(c.completed_at)), ...(await protectedDaysFor(userId))]),
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
