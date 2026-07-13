import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;
let userId;

before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(async () => {
  await resetUserData();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ana Prueba", email: "ana@uni.edu", password: "secreto1" });
  token = res.body.token;
  userId = res.body.user.id;
});
after(closeDb);

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

test("404 ejercicio inexistente, 403 curso bloqueado, 400 malformada, 401 sin token", async () => {
  assert.equal((await auth(request(app).post("/api/exercises/nope/answer")).send({ response: { index: 0 } })).status, 404);
  assert.equal((await auth(request(app).post("/api/exercises/bd2-l1-ex1/answer")).send({ response: { index: 0 } })).status, 403);
  const bad = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: { index: 99 } });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error, "Tu respuesta no tiene el formato esperado");
  assert.equal((await request(app).post("/api/exercises/l1-ex1/answer").send({ response: { index: 0 } })).status, 401);
});

test("incorrecta: registra intento, no completa, no da XP", async () => {
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await wrongResponseFor("l1-ex1") });
  assert.equal(res.body.correct, false);
  assert.ok(res.body.explanation.length > 0);
  assert.equal(res.body.lessonCompleted, false);
  assert.equal(res.body.xpAwarded, 0);
  const attempts = await query("SELECT * FROM answer_attempts WHERE user_id = ?", [userId]);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].correct, 0);
  assert.equal(attempts[0].context, "lesson");
  assert.equal((await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId])).length, 0);
});

test("un ejercicio correcto de dos NO completa la lección", async () => {
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.lessonCompleted, false);
  assert.equal(res.body.xpAwarded, 0);
  assert.equal(res.body.nextLessonId, null);
});

test("lección perfecta: completa con +50 +10, racha extendida y siguiente lección", async () => {
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  const res = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.lessonCompleted, true);
  assert.equal(res.body.xpAwarded, 50);
  assert.equal(res.body.perfectBonus, 10);
  assert.deepEqual(res.body.streak, { value: 1, extended: true });
  assert.equal(res.body.courseProgress, 10);
  assert.equal(res.body.nextLessonId, "l2");
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 60);
});

test("con un fallo previo no hay bonus perfecto", async () => {
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await wrongResponseFor("l1-ex1") });
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  const res = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(res.body.lessonCompleted, true);
  assert.equal(res.body.xpAwarded, 50);
  assert.equal(res.body.perfectBonus, 0);
});

test("re-responder tras completar no duplica XP y segunda lección del día no extiende racha", async () => {
  for (const ex of ["l1-ex1", "l1-ex2"]) {
    await auth(request(app).post(`/api/exercises/${ex}/answer`)).send({ response: await correctResponseFor(ex) });
  }
  const again = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(again.body.lessonCompleted, false);
  assert.equal(again.body.xpAwarded, 0);
  for (const ex of ["l2-ex1", "l2-ex2"]) {
    await auth(request(app).post(`/api/exercises/${ex}/answer`)).send({ response: await correctResponseFor(ex) });
  }
  const l2done = await auth(request(app).post("/api/exercises/l2-ex2/answer")).send({ response: await correctResponseFor("l2-ex2") });
  assert.equal(l2done.body.lessonCompleted, false); // ya estaba completa por el loop anterior
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 120); // 50+10 (l1) + 50+10 (l2), sin duplicados
  const completions = await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId]);
  assert.equal(completions.length, 2);
});
