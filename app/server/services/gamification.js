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
