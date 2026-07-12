import test from "node:test";
import assert from "node:assert/strict";
import { progressPercent, courseStatus } from "../server/services/progress.js";

test("porcentaje de progreso redondeado", () => {
  assert.equal(progressPercent(0, 10), 0);
  assert.equal(progressPercent(1, 10), 10);
  assert.equal(progressPercent(2, 3), 67);
  assert.equal(progressPercent(10, 10), 100);
  assert.equal(progressPercent(0, 0), 0);
});

test("estados por progreso", () => {
  assert.equal(courseStatus({ progress: 0 }), "NUEVO");
  assert.equal(courseStatus({ progress: 45 }), "EN CURSO");
  assert.equal(courseStatus({ progress: 100 }), "COMPLETADO");
});

test("BLOQUEADO prevalece cuando el prerequisito no está al 100", () => {
  assert.equal(courseStatus({ progress: 0, prereqProgress: 60 }), "BLOQUEADO");
  assert.equal(courseStatus({ progress: 50, prereqProgress: 0 }), "BLOQUEADO");
  assert.equal(courseStatus({ progress: 0, prereqProgress: 100 }), "NUEVO");
  assert.equal(courseStatus({ progress: 0, prereqProgress: null }), "NUEVO");
});
