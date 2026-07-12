import test from "node:test";
import assert from "node:assert/strict";
import { currentStreak, bestStreak, weeklyXp, toDayString } from "../server/services/gamification.js";

test("racha con días consecutivos hasta hoy", () => {
  assert.equal(currentStreak(["2026-07-09", "2026-07-10", "2026-07-11"], "2026-07-11"), 3);
});

test("hoy sin actividad no rompe la racha (cuenta desde ayer)", () => {
  assert.equal(currentStreak(["2026-07-09", "2026-07-10"], "2026-07-11"), 2);
});

test("un hueco rompe la racha", () => {
  assert.equal(currentStreak(["2026-07-08", "2026-07-10", "2026-07-11"], "2026-07-11"), 2);
});

test("sin actividad reciente la racha es 0", () => {
  assert.equal(currentStreak(["2026-07-01"], "2026-07-11"), 0);
  assert.equal(currentStreak([], "2026-07-11"), 0);
});

test("la racha cruza el cambio de mes", () => {
  assert.equal(currentStreak(["2026-06-30", "2026-07-01"], "2026-07-01"), 2);
});

test("mejor racha histórica", () => {
  assert.equal(bestStreak(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-08", "2026-07-09"]), 3);
  assert.equal(bestStreak([]), 0);
});

test("días duplicados cuentan una vez", () => {
  assert.equal(currentStreak(["2026-07-11", "2026-07-11", "2026-07-10"], "2026-07-11"), 2);
});

test("XP semanal solo cuenta los últimos 7 días", () => {
  const now = new Date("2026-07-11T12:00:00");
  const events = [
    { amount: 50, created_at: new Date("2026-07-10T10:00:00") },
    { amount: 50, created_at: new Date("2026-07-05T10:00:00") },
    { amount: 50, created_at: new Date("2026-07-01T10:00:00") },
  ];
  assert.equal(weeklyXp(events, now), 100);
});

test("toDayString formatea en zona local", () => {
  assert.equal(toDayString(new Date(2026, 6, 11, 23, 59)), "2026-07-11");
});
