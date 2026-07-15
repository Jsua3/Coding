import test from "node:test";
import assert from "node:assert/strict";
import { repairableGap } from "../server/services/gamification.js";

const W = 2;
const set = (...d) => new Set(d);

test("un hueco de 1 día, con actividad hoy, es reparable", () => {
  // activo el 8, falta el 9, activo el 10 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set(), "2026-07-10", W);
  assert.deepEqual(g, { days: ["2026-07-09"] });
});

test("un hueco de 2 días con ancla dentro de la ventana es reparable", () => {
  // activo el 8, faltan 9 y 10, activo el 11 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-11"), set(), "2026-07-11", W);
  assert.deepEqual(g, { days: ["2026-07-09", "2026-07-10"] });
});

test("3 días seguidos faltando: el ancla queda fuera de la ventana, no reparable", () => {
  // activo el 8, faltan 9,10,11, activo el 12 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-12"), set(), "2026-07-12", W);
  assert.equal(g, null);
});

test("no se puede fabricar una racha de la nada", () => {
  // solo activo hoy, todo lo demás vacío
  const g = repairableGap(set("2026-07-10"), set(), "2026-07-10", W);
  assert.equal(g, null);
});

test("racha larga y sana: el hueco de detrás es antiguo, nada que reparar", () => {
  const g = repairableGap(set("2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"), set(), "2026-07-10", W);
  assert.equal(g, null);
});

test("sin actividad hoy ni ayer: no hay racha viva que proteger", () => {
  // activo el 8, hoy es el 11 (ni 10 ni 11 activos)
  const g = repairableGap(set("2026-07-08"), set(), "2026-07-11", W);
  assert.equal(g, null);
});

test("hoy sin actividad pero ayer sí, con hueco fresco detrás: reparable", () => {
  // activo el 8, falta el 9, activo el 10, hoy es el 11 (sin actividad hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set(), "2026-07-11", W);
  assert.deepEqual(g, { days: ["2026-07-09"] });
});

test("un día ya protegido cuenta como crédito: cierra el hueco", () => {
  // activo el 8 y el 10 (hoy), el 9 ya está protegido -> no hay hueco reparable
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set("2026-07-09"), "2026-07-10", W);
  assert.equal(g, null);
});

test("borde exacto de la ventana: el día a windowDays de distancia sí entra", () => {
  // hoy 12; activo 12; falta 11; falta 10 (a 2 días, borde); activo 9 (ancla)
  const g = repairableGap(set("2026-07-09", "2026-07-12"), set(), "2026-07-12", W);
  assert.deepEqual(g, { days: ["2026-07-10", "2026-07-11"] });
});
