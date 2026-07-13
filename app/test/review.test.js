import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;

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
});
after(closeDb);

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

async function failOnce(exId) {
  await auth(request(app).post(`/api/exercises/${exId}/answer`)).send({ response: await wrongResponseFor(exId) });
}

test("fallar encola; acertar en modo lección NO desencola", async () => {
  await failOnce("l1-ex1");
  let review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1);
  assert.equal(review.body.exercises[0].id, "l1-ex1");
  assert.ok(!JSON.stringify(review.body).includes("\"answer\""));
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1, "sigue pendiente: el acierto fue en modo lección");
});

test("acertar en modo review desencola, da +5 una sola vez", async () => {
  await failOnce("l1-ex1");
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.reviewCleared, true);
  assert.equal(res.body.xpAwarded, 5);
  assert.equal(res.body.lessonCompleted, false, "review nunca completa lecciones");
  const review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 0);
  const again = await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  assert.equal(again.body.reviewCleared, false);
  assert.equal(again.body.xpAwarded, 0);
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events");
  assert.equal(Number(xp[0].total), 5);
});

test("fallar en review lo mantiene en cola; re-fallo tras limpiar re-encola", async () => {
  await failOnce("l1-ex1");
  await failOnce("l1-ex1"); // dos fallos, una sola entrada en cola (agrupa por ejercicio)
  let review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1);
  await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  await failOnce("l1-ex1");
  review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1, "un fallo posterior a la limpieza re-encola");
});

test("la cola se limita a 10 y me.stats.reviewCount refleja el total", async () => {
  const lessons = await query(
    `SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'bd1' ORDER BY u.order_index, l.order_index`
  );
  for (const { id } of lessons) {
    await failOnce(id + "-ex1");
    await failOnce(id + "-ex2");
  }
  const review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.exercises.length, 10);
  assert.equal(review.body.count, 20);
  const me = await auth(request(app).get("/api/me"));
  assert.equal(me.body.stats.reviewCount, 20);
});
