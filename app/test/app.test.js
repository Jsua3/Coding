import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../server/index.js";

test("GET /api/health responde ok", async () => {
  const res = await request(createApp()).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});

test("ruta /api desconocida responde 404 JSON", async () => {
  const res = await request(createApp()).get("/api/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Recurso no encontrado");
});
