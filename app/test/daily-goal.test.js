import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Ana", email: "ana@test.dev", password: "secreto1" });
  return r.body.token;
}

test("sin token, 401", async () => {
  const r = await request(app).put("/api/me/daily-goal").send({ goal: 100 });
  assert.equal(r.status, 401);
});

test("una meta válida se guarda", async () => {
  const token = await registrar();
  const r = await request(app).put("/api/me/daily-goal").set("Authorization", "Bearer " + token).send({ goal: 100 });
  assert.equal(r.status, 200);
  assert.equal(r.body.dailyGoal, 100);
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 100);
});

test("una meta fuera de la escala se rechaza con 400", async () => {
  const token = await registrar();
  const r = await request(app).put("/api/me/daily-goal").set("Authorization", "Bearer " + token).send({ goal: 77 });
  assert.equal(r.status, 400);
  // Y no cambió el default.
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 50);
});
