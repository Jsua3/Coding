import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { heatmapFrom, weekXpFrom, achievementStats, unlockedIds } from "../server/services/metagame.js";

// ---------- puras ----------

test("el heatmap rellena los dias vacios y termina en hoy", () => {
  const byDay = new Map([["2026-07-14", { lessons: 2, xp: 110 }]]);
  const out = heatmapFrom(byDay, 3, new Date(2026, 6, 14));
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], { day: "2026-07-12", lessons: 0, xp: 0 });
  assert.deepEqual(out[1], { day: "2026-07-13", lessons: 0, xp: 0 });
  assert.deepEqual(out[2], { day: "2026-07-14", lessons: 2, xp: 110 });
});

test("la semana son 7 dias hasta hoy, con los vacios", () => {
  const byDay = new Map([["2026-07-14", { lessons: 1, xp: 50 }]]);
  const out = weekXpFrom(byDay, new Date(2026, 6, 14));
  assert.equal(out.length, 7);
  assert.equal(out[0].day, "2026-07-08");
  assert.equal(out[6].day, "2026-07-14");
  assert.equal(out[6].xp, 50);
  assert.equal(out[0].xp, 0);
});

test("el heatmap cruza el cambio de mes", () => {
  const out = heatmapFrom(new Map(), 2, new Date(2026, 6, 1));
  assert.deepEqual(out.map((c) => c.day), ["2026-06-30", "2026-07-01"]);
});

// ---------- contra la BD ----------

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function crearUsuario() {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('Test', 'stats@test.dev', 'x')");
  return r.insertId;
}

test("sin actividad, todos los contadores estan a cero", async () => {
  const id = await crearUsuario();
  const s = await achievementStats(id);
  assert.equal(s.lessonsDone, 0);
  assert.equal(s.perfectLessons, 0);
  assert.equal(s.reviewCleared, 0);
  assert.equal(s.coursesCompleted, 0);
  assert.equal(s.perfectRun, 0);
  assert.equal(s.earlyBird, false);
  assert.equal(s.nightOwl, false);
  assert.equal(s.resurrected, false);
  assert.equal((await unlockedIds(id)).size, 0);
});

test("las lecciones perfectas se derivan del importe 10 del evento de XP", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1'), (?, 'l2')", [id, id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l1', 10), (?, 'l2', 50)", [id, id, id]);
  const s = await achievementStats(id);
  assert.equal(s.lessonsDone, 2);
  assert.equal(s.perfectLessons, 1);
});

test("los repasos corregidos se derivan del importe 5", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 5), (?, 'l2', 5), (?, 'l3', 50)", [id, id, id]);
  const s = await achievementStats(id);
  assert.equal(s.reviewCleared, 2);
});

test("los secretos de horario son disjuntos: las 03:00 es nocturno, no madrugador", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 03:30:00')", [id]);
  const s = await achievementStats(id);
  assert.equal(s.nightOwl, true);
  assert.equal(s.earlyBird, false);
});

test("las 06:00 es madrugador, no nocturno", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 06:00:00')", [id]);
  const s = await achievementStats(id);
  assert.equal(s.earlyBird, true);
  assert.equal(s.nightOwl, false);
});

test("resucitado: 3 fallos y luego un acierto EN REPASO", async () => {
  const id = await crearUsuario();
  const ex = "l1-ex1";
  await query(
    "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?,?, 'lesson', 0), (?,?, 'lesson', 0), (?,?, 'lesson', 0)",
    [id, ex, id, ex, id, ex]
  );
  let s = await achievementStats(id);
  assert.equal(s.resurrected, false, "tres fallos solos no bastan");
  await query("INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, 'review', 1)", [id, ex]);
  s = await achievementStats(id);
  assert.equal(s.resurrected, true);
});

test("perfectRun cuenta lecciones perfectas CONSECUTIVAS por orden de completado", async () => {
  const id = await crearUsuario();
  // l1 perfecta, l2 NO, l3 y l4 perfectas -> la racha maxima es 2
  await query(
    `INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES
     (?, 'l1', '2026-07-01 10:00:00'), (?, 'l2', '2026-07-02 10:00:00'),
     (?, 'l3', '2026-07-03 10:00:00'), (?, 'l4', '2026-07-04 10:00:00')`,
    [id, id, id, id]
  );
  await query(
    "INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 10), (?, 'l3', 10), (?, 'l4', 10)",
    [id, id, id]
  );
  const s = await achievementStats(id);
  assert.equal(s.perfectLessons, 3);
  assert.equal(s.perfectRun, 2);
});

test("activityByDay agrupa lecciones y XP por dia", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 10:00:00'), (?, 'l2', '2026-07-10 18:00:00')", [id, id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l1', 50, '2026-07-10 10:00:00'), (?, 'l2', 50, '2026-07-10 18:00:00')", [id, id]);
  const { activityByDay } = await import("../server/services/metagame.js");
  const map = await activityByDay(id);
  assert.deepEqual(map.get("2026-07-10"), { lessons: 2, xp: 100 });
});
