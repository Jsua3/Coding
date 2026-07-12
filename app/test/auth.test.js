import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { setupTestDb, resetUserData, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { requireAuth } from "../server/auth.js";

let app;
before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(resetUserData);
after(closeDb);

const good = { name: "Juan Jose Sua", email: "juan@uni.edu", password: "secreto1" };

test("registro feliz devuelve 201 con token y usuario", async () => {
  const res = await request(app).post("/api/auth/register").send(good);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.name, "Juan Jose Sua");
  assert.equal(res.body.user.email, "juan@uni.edu");
  assert.equal(res.body.user.initials, "JJ");
  assert.ok(!("password_hash" in res.body.user));
});

test("email duplicado devuelve 409", async () => {
  await request(app).post("/api/auth/register").send(good);
  const res = await request(app).post("/api/auth/register").send(good);
  assert.equal(res.status, 409);
  assert.equal(res.body.error, "Este correo ya está registrado");
});

test("validaciones de registro devuelven 400", async () => {
  for (const body of [
    { ...good, name: "  " },
    { ...good, email: "no-es-email" },
    { ...good, password: "corta" },
  ]) {
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok(res.body.error);
  }
});

test("login feliz y credenciales malas", async () => {
  await request(app).post("/api/auth/register").send(good);
  const ok = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await request(app).post("/api/auth/login").send({ email: good.email, password: "incorrecta" });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error, "Correo o contraseña incorrectos");
});

test("remember extiende el token a 30 días", async () => {
  await request(app).post("/api/auth/register").send(good);
  const short = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password });
  const long = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password, remember: true });
  const dShort = jwt.decode(short.body.token);
  const dLong = jwt.decode(long.body.token);
  assert.equal(dShort.exp - dShort.iat, 24 * 60 * 60);
  assert.equal(dLong.exp - dLong.iat, 30 * 24 * 60 * 60);
});

test("requireAuth rechaza sin token y acepta token válido", () => {
  let status = null;
  const res = { status(s) { status = s; return this; }, json() {} };
  requireAuth({ headers: {} }, res, () => assert.fail("no debería llamar next"));
  assert.equal(status, 401);

  const token = jwt.sign({ sub: 7 }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  requireAuth(req, {}, () => { called = true; });
  assert.ok(called);
  assert.equal(req.userId, 7);
});

test("JSON malformado devuelve 400", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{no es json");
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "JSON inválido");
});
