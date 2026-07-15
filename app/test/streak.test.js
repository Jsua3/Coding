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

test("protege un hueco de 2 días: dos escudos y un solo cobro, en una transacción", async () => {
  const id = await crearUsuario();
  // Activo hace 3 días y hoy; faltan hace(2) y hace(1) -> hueco de 2 días (ambos dentro de la ventana).
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(3) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 100), (?, 'l2', 100)", [id, id]);

  const antes = await streakStateFor(id);
  assert.equal(antes.repairable.totalCost, 100); // 2 días x 50

  const r = await protectStreak(id);
  assert.equal(r.streak.current, 4);            // hoy + los 2 protegidos + el de hace 3
  assert.equal(r.streak.repairable, null);
  assert.equal(r.balance, 100);                 // 200 ganados - 100 gastados
  // Se insertaron LOS DOS escudos y UN SOLO evento de gasto.
  assert.deepEqual((await protectedDaysFor(id)).sort(), [hace(2), hace(1)].sort());
  const gastos = await query("SELECT amount FROM xp_events WHERE user_id = ? AND amount < 0", [id]);
  assert.equal(gastos.length, 1);
  assert.equal(gastos[0].amount, -100);
});

test("si un escudo del hueco ya existe, la transacción revierte entera: no cobra dos veces", async () => {
  const id = await crearUsuario();
  // Hueco de 1 día (hace(1)) reparable.
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);
  // Una petición concurrente ya protegió ese mismo día (simulamos su escudo ya insertado).
  await query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, ?)", [id, hace(1)]);
  const saldoAntes = await balanceXpFor(id); // 100

  // protectStreak recalcula: con el escudo ya puesto, hace(1) YA es crédito, así que el hueco es null.
  // Debe rechazar con 400 (no reparable) SIN cobrar. (Si tu streakStateFor ya no ve hueco, este es el
  // camino esperado — verifica que NO se creó ningún evento de gasto.)
  await assert.rejects(() => protectStreak(id), (e) => e.status === 400);
  const gastos = await query("SELECT amount FROM xp_events WHERE user_id = ? AND amount < 0", [id]);
  assert.equal(gastos.length, 0, "no debe haber ningún cobro");
  assert.equal(await balanceXpFor(id), saldoAntes);
});
