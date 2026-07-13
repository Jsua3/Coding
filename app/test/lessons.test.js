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

test("GET lección: contenido y ejercicios sin respuestas", async () => {
  const res = await auth(request(app).get("/api/lessons/l5"));
  assert.equal(res.status, 200);
  assert.equal(res.body.title, "Consultas SELECT y WHERE");
  assert.equal(res.body.courseId, "bd1");
  assert.deepEqual(res.body.position, { index: 5, total: 10 });
  assert.ok(Array.isArray(res.body.content) && res.body.content.length >= 2);
  assert.equal(res.body.exercises.length, 2);
  assert.deepEqual(res.body.exercises.map((e) => e.id), ["l5-ex1", "l5-ex2"]);
  assert.equal(res.body.exercises[0].type, "choice");
  assert.equal(res.body.exercises[0].payload.options.length, 4);
  const body = JSON.stringify(res.body);
  assert.ok(!body.includes("\"answer\""), "answer filtrado");
  assert.ok(!body.includes("correct_index"), "correct_index filtrado");
  assert.ok(!("quiz" in res.body), "quiz retirado");
});

test("GET lección inexistente 404; lección de curso bloqueado 403", async () => {
  assert.equal((await auth(request(app).get("/api/lessons/nope"))).status, 404);
  assert.equal((await auth(request(app).get("/api/lessons/bd2-l1"))).status, 403);
});
