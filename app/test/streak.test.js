import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { protectedDaysFor, streakStateFor, balanceXpFor, protectStreak } from "../server/services/streak.js";
import { toDayString } from "../server/services/gamification.js";

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function crearUsuario() {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('T', 't@test.dev', 'x')");
  return r.insertId;
}
// Un día "YYYY-MM-DD" a N días de hoy (hacia atrás).
function hace(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDayString(d);
}

test("balanceXpFor resta los gastos", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, NULL, -50)", [id, id]);
  assert.equal(await balanceXpFor(id), 0);
});

test("protectStreak cobra el coste, protege el día y reconecta la racha", async () => {
  const id = await crearUsuario();
  // Actividad hace 2 días y hoy; falta ayer -> hueco de 1 día reparable.
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);

  const antes = await streakStateFor(id);
  assert.equal(antes.current, 1);           // solo hoy
  assert.ok(antes.repairable);
  assert.equal(antes.repairable.totalCost, 50);

  const r = await protectStreak(id);
  assert.equal(r.balance, 50);              // 100 ganados - 50 gastados
  assert.equal(r.streak.current, 3);        // hoy + ayer(protegido) + antier
  assert.equal(r.streak.repairable, null);  // ya no hay hueco
  assert.deepEqual(await protectedDaysFor(id), [hace(1)]);
});

test("protectStreak rechaza si no hay hueco reparable", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?)", [id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [id]);
  await assert.rejects(() => protectStreak(id), (e) => e.status === 400);
});

test("protectStreak rechaza si el saldo no alcanza", async () => {
  const id = await crearUsuario();
  // Hueco reparable de 1 día, pero el usuario tiene 0 de saldo gastable (nunca ganó XP suelto).
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  // Solo 40 XP ganados: por debajo del coste de 50.
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 20), (?, 'l2', 20)", [id, id]);
  await assert.rejects(() => protectStreak(id), (e) => e.status === 400 && /XP/.test(e.message));
  // Y NO cobró: el saldo sigue intacto y no hay escudo.
  assert.equal(await balanceXpFor(id), 40);
  assert.deepEqual(await protectedDaysFor(id), []);
});

test("un día protegido cuenta para bestStreak (y por tanto para los logros de constancia)", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);
  await protectStreak(id);
  const { achievementStats } = await import("../server/services/metagame.js");
  const s = await achievementStats(id);
  assert.equal(s.bestStreak, 3); // los 3 días consecutivos, con el del medio protegido
});
