import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, levelFor } from "../server/services/levels.js";

test("la curva es ascendente, sin huecos ni retrocesos", () => {
  assert.equal(LEVELS.length, 12);
  assert.equal(LEVELS[0].xp, 0);
  for (let i = 1; i < LEVELS.length; i++) {
    assert.equal(LEVELS[i].n, i + 1);
    assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp, `el nivel ${i + 1} no supera al anterior`);
  }
  // El último nivel se alcanza justo al terminar el temario: 71 lecciones x 50 XP.
  assert.equal(LEVELS[11].xp, 71 * 50);
  assert.equal(LEVELS[11].name, "Maestro");
  assert.deepEqual(LEVELS.map((l) => l.name), [
    "Aprendiz", "Practicante", "Junior", "Desarrollador", "Semi-senior", "Senior",
    "Especialista", "Tech lead", "Referente", "Principal", "Arquitecto", "Maestro",
  ]);
});

test("la curva exige de verdad: los umbrales son los acordados", () => {
  // La vara nueva: cada título tiene ancla narrativa (Junior ≈ tu primer curso;
  // Senior = la mitad del temario; Maestro = el temario entero).
  assert.deepEqual(LEVELS.map((l) => l.xp), [0, 100, 400, 800, 1250, 1800, 2300, 2750, 3100, 3350, 3500, 3550]);
});

test("sin XP eres Aprendiz al 0%", () => {
  const l = levelFor(0);
  assert.equal(l.n, 1);
  assert.equal(l.name, "Aprendiz");
  assert.equal(l.progress, 0);
  assert.equal(l.xpInLevel, 0);
  assert.equal(l.xpToNext, 100);
  assert.equal(l.next.name, "Practicante");
});

test("cada umbral exacto entra en su nivel al 0%", () => {
  for (const lvl of LEVELS) {
    const l = levelFor(lvl.xp);
    assert.equal(l.n, lvl.n, `xp ${lvl.xp} deberia ser nivel ${lvl.n}`);
    assert.equal(l.xpInLevel, 0);
  }
});

test("justo debajo de un umbral sigues en el nivel anterior", () => {
  assert.equal(levelFor(99).n, 1);
  assert.equal(levelFor(100).n, 2);
  assert.equal(levelFor(3549).n, 11);
  assert.equal(levelFor(3550).n, 12);
});

test("el progreso dentro del nivel se calcula sobre el tramo", () => {
  // Nivel 2 (Practicante) va de 100 a 400: 300 XP de tramo.
  const l = levelFor(250);
  assert.equal(l.n, 2);
  assert.equal(l.xpInLevel, 150);
  assert.equal(l.xpToNext, 150);
  assert.equal(l.progress, 50);
});

test("en el ultimo nivel no hay siguiente y el progreso es 100", () => {
  const l = levelFor(5000);
  assert.equal(l.n, 12);
  assert.equal(l.name, "Maestro");
  assert.equal(l.next, null);
  assert.equal(l.xpToNext, 0);
  assert.equal(l.progress, 100);
});

test("XP invalido o negativo no rompe: eres Aprendiz", () => {
  assert.equal(levelFor(-10).n, 1);
  assert.equal(levelFor(undefined).n, 1);
});

test("el progreso nunca llega a 100 si todavia falta XP para el siguiente nivel", () => {
  for (const xp of [99, 399, 799, 1249, 1799, 2299, 2749, 3099, 3349, 3499, 3549]) {
    const l = levelFor(xp);
    assert.ok(l.next !== null, `${xp} XP deberia tener nivel siguiente`);
    assert.ok(l.xpToNext > 0, `${xp} XP deberia tener XP pendiente`);
    assert.ok(l.progress < 100, `${xp} XP: progress ${l.progress} no puede ser 100 si faltan ${l.xpToNext} XP`);
  }
});
