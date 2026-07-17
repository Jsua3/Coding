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

test("sin token responde 401", async () => {
  const res = await request(app).get("/api/courses");
  assert.equal(res.status, 401);
});

test("catálogo para usuario nuevo: 8 cursos, bd2 y uml bloqueados, resto nuevo", async () => {
  const res = await auth(request(app).get("/api/courses"));
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 8);
  assert.deepEqual(res.body.map((c) => c.id), ["bd1", "prog2", "algo", "bd2", "prog1", "web", "reqsw", "uml"]);
  const byId = Object.fromEntries(res.body.map((c) => [c.id, c]));
  assert.equal(byId.bd2.status, "BLOQUEADO");
  assert.equal(byId.bd1.status, "NUEVO");
  assert.equal(byId.bd1.progress, 0);
  assert.equal(byId.bd1.lessons, 10);
  assert.equal(byId.bd1.hours, 4);
  assert.equal(byId.reqsw.status, "NUEVO");
  assert.equal(byId.reqsw.lessons, 7);
  assert.equal(byId.uml.status, "BLOQUEADO");
  assert.equal(byId.uml.lessons, 9);
});

test("detalle de curso con lección current", async () => {
  const res = await auth(request(app).get("/api/courses/bd1"));
  assert.equal(res.status, 200);
  assert.equal(res.body.units.length, 3);
  const lessons = res.body.units.flatMap((u) => u.lessons);
  assert.equal(lessons.length, 10);
  assert.equal(lessons[0].id, "l1");
  assert.equal(lessons[0].current, true);
  assert.equal(lessons.filter((l) => l.current).length, 1);
});

test("progreso tras completar una lección", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1')", [userId]);
  const detail = await auth(request(app).get("/api/courses/bd1"));
  assert.equal(detail.body.progress, 10);
  const lessons = detail.body.units.flatMap((u) => u.lessons);
  assert.equal(lessons.find((l) => l.id === "l1").done, true);
  assert.equal(lessons.find((l) => l.id === "l2").current, true);
  const list = await auth(request(app).get("/api/courses"));
  assert.equal(list.body.find((c) => c.id === "bd1").status, "EN CURSO");
});

test("curso bloqueado responde 403 con el prerequisito", async () => {
  const res = await auth(request(app).get("/api/courses/bd2"));
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Bases de datos I/);
});

test("uml bloqueado responde 403 con su prerequisito para un usuario nuevo", async () => {
  const res = await auth(request(app).get("/api/courses/uml"));
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Ingeniería de software/);
});

test("curso inexistente responde 404", async () => {
  const res = await auth(request(app).get("/api/courses/nope"));
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Esta materia no existe");
});
