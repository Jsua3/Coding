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

const me = () => request(app).get("/api/me").set("Authorization", `Bearer ${token}`);

test("usuario nuevo: stats en cero y continue apunta a bd1/l1", async () => {
  const res = await me();
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, "Ana Prueba");
  assert.deepEqual(res.body.stats, {
    xp: 0, xpWeek: 0, streak: 0, bestStreak: 0,
    level: { n: 1, name: "Aprendiz", progress: 0 },
    dailyGoal: 50, xpToday: 0, balance: 0,
    activeCourses: 0, completedCourses: 0, lockedCourses: 2,
    reviewCount: 0,
  });
  assert.deepEqual(res.body.continue, { courseId: "bd1", lessonId: "l1", lessonTitle: "Qué es un SGBD" });
});

test("xp, racha y continue reflejan la actividad", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', NOW() - INTERVAL 1 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l2', NOW())", [userId]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l1', 50, NOW() - INTERVAL 1 DAY)", [userId]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l2', 50, NOW())", [userId]);
  const res = await me();
  assert.equal(res.body.stats.xp, 100);
  assert.equal(res.body.stats.xpWeek, 100);
  assert.equal(res.body.stats.streak, 2);
  assert.equal(res.body.stats.bestStreak, 2);
  assert.equal(res.body.stats.activeCourses, 1);
  assert.deepEqual(res.body.continue.courseId, "bd1");
  assert.equal(res.body.continue.lessonId, "l3");
});

test("racha con hueco solo cuenta el tramo reciente", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', NOW() - INTERVAL 5 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l2', NOW() - INTERVAL 4 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l3', NOW())", [userId]);
  const res = await me();
  assert.equal(res.body.stats.streak, 1);
  assert.equal(res.body.stats.bestStreak, 2);
});

test("token de usuario borrado responde 401", async () => {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("DELETE FROM users WHERE id = ?", [userId]);
  await query("SET FOREIGN_KEY_CHECKS = 1");
  const res = await me();
  assert.equal(res.status, 401);
});

test("/me trae el nivel derivado del XP", async () => {
  // Con la vara nueva, Practicante exige 100 XP: 50 XP te deja a mitad del nivel 1 (Aprendiz).
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [userId]);
  const res = await me();
  assert.equal(res.status, 200);
  assert.equal(res.body.stats.level.n, 1);
  assert.equal(res.body.stats.level.name, "Aprendiz");
  assert.equal(res.body.stats.level.progress, 50);
});

test("gastar XP baja el saldo pero NO el nivel ni el xp ganado", async () => {
  // 110 XP ganados -> nivel 2 (Practicante), antes de gastar nada.
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 110)", [userId]);
  const antes = await me();
  assert.equal(antes.body.stats.level.n, 2);
  assert.equal(antes.body.stats.level.name, "Practicante");

  // Un gasto de 50 (escudo) no debe bajar el nivel ni el XP ganado: si el nivel saliera
  // del saldo (110 - 50 = 60), volveria a Aprendiz.
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, NULL, -50)", [userId]);
  const despues = await me();
  assert.equal(despues.body.stats.xp, 110);      // ganado, no toca el gasto
  assert.equal(despues.body.stats.balance, 60);  // saldo: 110 - 50
  assert.equal(despues.body.stats.level.n, 2);   // el nivel NO baja
  assert.equal(despues.body.stats.level.name, "Practicante");
});
