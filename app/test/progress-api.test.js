import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { ACHIEVEMENTS } from "../server/services/achievements.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Ana Ruiz", email: "ana@test.dev", password: "secreto1" });
  return r.body.token;
}

test("sin token, /progress responde 401", async () => {
  const r = await request(app).get("/api/progress");
  assert.equal(r.status, 401);
});

test("un usuario nuevo esta en el nivel 1 y sin logros", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 200);
  assert.equal(r.body.level.n, 1);
  assert.equal(r.body.level.name, "Aprendiz");
  assert.equal(r.body.achievements.length, 17);
  assert.equal(r.body.achievements.filter((a) => a.unlocked).length, 0);
});

test("el heatmap trae 365 dias y la semana 7, con los vacios incluidos", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.body.heatmap.length, 365);
  assert.equal(r.body.weekXp.length, 7);
  // El ultimo dia del heatmap es hoy, y es el mismo que el ultimo de la semana.
  assert.equal(r.body.heatmap[364].day, r.body.weekXp[6].day);
  for (const cell of r.body.heatmap) {
    assert.equal(typeof cell.lessons, "number");
    assert.equal(typeof cell.xp, "number");
  }
});

test("los logros secretos bloqueados NO filtran su nombre por la red", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  const crudo = JSON.stringify(r.body);
  for (const a of ACHIEVEMENTS.filter((x) => x.secret)) {
    assert.ok(!crudo.includes(a.name), `el secreto "${a.name}" viajo por la red estando bloqueado`);
  }
});

test("el XP y los logros se reflejan en /progress", async () => {
  const token = await registrar();
  const [u] = await query("SELECT id FROM users WHERE email = 'ana@test.dev'");
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1')", [u.id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [u.id]);

  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.body.level.n, 2); // 50 XP = Practicante
  assert.equal(r.body.level.name, "Practicante");
  const primer = r.body.achievements.find((a) => a.id === "primera-leccion");
  assert.equal(primer.unlocked, true);
});
