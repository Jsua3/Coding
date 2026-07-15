import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { toDayString } from "../server/services/gamification.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Leo", email: "leo@test.dev", password: "secreto1" });
  return { token: r.body.token, id: r.body.user.id };
}
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return toDayString(d); }

test("sin token, 401", async () => {
  const r = await request(app).post("/api/streak/protect");
  assert.equal(r.status, 401);
});

test("proteger un hueco reparable reconecta la racha y descuenta el saldo", async () => {
  const { token, id } = await registrar();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);

  const r = await request(app).post("/api/streak/protect").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 200);
  assert.equal(r.body.streak.current, 3);
  assert.equal(r.body.streak.repairable, null);
  assert.equal(r.body.balance, 50);
});

test("sin hueco reparable, 400", async () => {
  const { token } = await registrar();
  const r = await request(app).post("/api/streak/protect").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 400);
  assert.ok(r.body.error);
});
