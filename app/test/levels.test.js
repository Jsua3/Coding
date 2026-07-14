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
  // El último nivel se alcanza justo al terminar el temario: 64 lecciones x 50 XP.
  assert.equal(LEVELS[11].xp, 3200);
  assert.equal(LEVELS[11].name, "Maestro");
});

test("sin XP eres Aprendiz al 0%", () => {
  const l = levelFor(0);
  assert.equal(l.n, 1);
  assert.equal(l.name, "Aprendiz");
  assert.equal(l.progress, 0);
  assert.equal(l.xpInLevel, 0);
  assert.equal(l.xpToNext, 50);
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
  assert.equal(levelFor(49).n, 1);
  assert.equal(levelFor(50).n, 2);
  assert.equal(levelFor(3199).n, 11);
  assert.equal(levelFor(3200).n, 12);
});

test("el progreso dentro del nivel se calcula sobre el tramo", () => {
  // Nivel 2 (Practicante) va de 50 a 150: 100 XP de tramo.
  const l = levelFor(100);
  assert.equal(l.n, 2);
  assert.equal(l.xpInLevel, 50);
  assert.equal(l.xpToNext, 50);
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
