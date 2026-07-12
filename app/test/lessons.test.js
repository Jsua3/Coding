import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
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

async function correctIndexOf(lessonId) {
  const [q] = await query("SELECT correct_index FROM quiz_questions WHERE lesson_id = ?", [lessonId]);
  return q.correct_index;
}

test("GET lección: contenido y quiz sin la respuesta correcta", async () => {
  const res = await auth(request(app).get("/api/lessons/l5"));
  assert.equal(res.status, 200);
  assert.equal(res.body.title, "Consultas SELECT y WHERE");
  assert.equal(res.body.courseId, "bd1");
  assert.deepEqual(res.body.position, { index: 5, total: 10 });
  assert.ok(Array.isArray(res.body.content) && res.body.content.length >= 2);
  assert.equal(res.body.quiz.options.length, 4);
  assert.ok(!JSON.stringify(res.body).includes("correct_index"));
});

test("GET lección inexistente 404; lección de curso bloqueado 403", async () => {
  assert.equal((await auth(request(app).get("/api/lessons/nope"))).status, 404);
  assert.equal((await auth(request(app).get("/api/lessons/bd2-l1"))).status, 403);
});

test("answerIndex inválido responde 400", async () => {
  for (const bad of [undefined, -1, 4, "2", 1.5]) {
    const res = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: bad });
    assert.equal(res.status, 400, String(bad));
  }
});

test("respuesta incorrecta no completa ni da XP", async () => {
  const right = await correctIndexOf("l1");
  const wrong = (right + 1) % 4;
  const res = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: wrong });
  assert.equal(res.body.correct, false);
  assert.equal(res.body.xpAwarded, 0);
  assert.ok(res.body.explanation.length > 0);
  const done = await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId]);
  assert.equal(done.length, 0);
});

test("respuesta correcta completa, da 50 XP una sola vez y avanza", async () => {
  const right = await correctIndexOf("l1");
  const first = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: right });
  assert.equal(first.body.correct, true);
  assert.equal(first.body.xpAwarded, 50);
  assert.equal(first.body.alreadyCompleted, false);
  assert.equal(first.body.courseProgress, 10);
  assert.equal(first.body.nextLessonId, "l2");

  const again = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: right });
  assert.equal(again.body.correct, true);
  assert.equal(again.body.xpAwarded, 0);
  assert.equal(again.body.alreadyCompleted, true);

  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 50);
});

test("completar todo bd1 desbloquea bd2 y la última lección no tiene siguiente", async () => {
  const lessons = await query(
    `SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'bd1' ORDER BY u.order_index, l.order_index`
  );
  let last;
  for (const { id } of lessons) {
    const right = await correctIndexOf(id);
    last = await auth(request(app).post(`/api/lessons/${id}/answer`)).send({ answerIndex: right });
  }
  assert.equal(last.body.courseProgress, 100);
  assert.equal(last.body.nextLessonId, null);
  const bd2 = await auth(request(app).get("/api/courses/bd2"));
  assert.equal(bd2.status, 200);
});
