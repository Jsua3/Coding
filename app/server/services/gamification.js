const DAY_MS = 24 * 60 * 60 * 1000;

export function toDayString(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function previousDay(dayStr) {
  const [y, m, d] = dayStr.split("-").map(Number);
  return toDayString(new Date(y, m - 1, d - 1));
}

export function currentStreak(days, today) {
  const set = new Set(days);
  let cursor = set.has(today) ? today : previousDay(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}

export function bestStreak(days) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    run = prev !== null && previousDay(day) === prev ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

export function weeklyXp(events, now = new Date()) {
  const cutoff = now.getTime() - 7 * DAY_MS;
  return events
    .filter((e) => new Date(e.created_at).getTime() >= cutoff)
    .reduce((sum, e) => sum + e.amount, 0);
}

// Distancia en días entre dos "YYYY-MM-DD" (today - day). UTC para no tropezar con el horario de verano.
function daysBetween(dayStr, todayStr) {
  const [y1, m1, d1] = dayStr.split("-").map(Number);
  const [y2, m2, d2] = todayStr.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// El hueco reparable inmediatamente detrás de la racha actual, o null. Un día "cuenta" si tuviste
// actividad O lo protegiste. Tres guardas lo hacen honesto:
//   1. Sin actividad hoy ni ayer -> no hay racha viva -> null.
//   2. El hueco solo se recoge dentro de la ventana (today - día <= windowDays).
//   3. Reparable SOLO si el hueco topa con un día con crédito (un ancla: hubo racha antes). Si se
//      acaba la ventana antes del ancla -> null. Esto bloquea fabricar una racha de la nada.
export function repairableGap(activeDays, protectedDays, today, windowDays) {
  const credited = new Set([...activeDays, ...protectedDays]);
  let cursor = credited.has(today) ? today : previousDay(today);
  if (!credited.has(cursor)) return null; // guarda 1
  while (credited.has(previousDay(cursor))) cursor = previousDay(cursor);
  const streakStart = cursor;
  const gap = [];
  let d = previousDay(streakStart);
  while (!credited.has(d) && daysBetween(d, today) <= windowDays) { // guarda 2
    gap.push(d);
    d = previousDay(d);
  }
  if (gap.length === 0) return null;
  if (!credited.has(d)) return null; // guarda 3: se acabó la ventana antes del ancla
  return { days: gap.reverse() };
}
