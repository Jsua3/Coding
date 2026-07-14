import test from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, unlockedFor, achievementsFor, achievementInfo } from "../server/services/achievements.js";

const VACIO = {
  lessonsDone: 0, bestStreak: 0, perfectLessons: 0, coursesCompleted: 0, reviewCleared: 0,
  earlyBird: false, nightOwl: false, resurrected: false, perfectRun: 0,
};

test("el catalogo tiene 17 logros, 4 de ellos secretos, con ids unicos", () => {
  assert.equal(ACHIEVEMENTS.length, 17);
  assert.equal(ACHIEVEMENTS.filter((a) => a.secret).length, 4);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 17);
});

test("sin actividad no hay ningun logro", () => {
  assert.equal(unlockedFor(VACIO).size, 0);
});

test("cada logro cae exactamente en su umbral, no antes", () => {
  for (const a of ACHIEVEMENTS) {
    const justo = { ...VACIO, [a.metric]: a.target };
    const debajo = { ...VACIO, [a.metric]: typeof a.target === "number" ? a.target - 1 : false };
    assert.ok(unlockedFor(justo).has(a.id), `${a.id} deberia caer con ${a.metric} = ${a.target}`);
    assert.ok(!unlockedFor(debajo).has(a.id), `${a.id} NO deberia caer por debajo del umbral`);
  }
});

test("pasarse del umbral tambien lo desbloquea", () => {
  assert.ok(unlockedFor({ ...VACIO, lessonsDone: 100 }).has("todas-las-lecciones"));
  assert.ok(unlockedFor({ ...VACIO, bestStreak: 99 }).has("racha-30"));
});

test("los booleanos secretos funcionan como umbral 1", () => {
  assert.ok(unlockedFor({ ...VACIO, earlyBird: true }).has("madrugador"));
  assert.ok(unlockedFor({ ...VACIO, nightOwl: true }).has("nocturno"));
  assert.ok(unlockedFor({ ...VACIO, resurrected: true }).has("resucitado"));
  assert.ok(unlockedFor({ ...VACIO, perfectRun: 5 }).has("impecable"));
  assert.ok(!unlockedFor({ ...VACIO, perfectRun: 4 }).has("impecable"));
});

test("el conjunto de desbloqueados nunca encoge al crecer los contadores", () => {
  const pocos = { ...VACIO, lessonsDone: 10, bestStreak: 3 };
  const muchos = { ...VACIO, lessonsDone: 30, bestStreak: 8 };
  for (const id of unlockedFor(pocos)) {
    assert.ok(unlockedFor(muchos).has(id), `${id} se perdio al progresar`);
  }
});

test("un secreto bloqueado NO filtra su nombre real por la API", () => {
  const serializado = JSON.stringify(achievementsFor(VACIO));
  for (const a of ACHIEVEMENTS.filter((x) => x.secret)) {
    assert.ok(!serializado.includes(a.name), `el secreto "${a.name}" se filtro estando bloqueado`);
    assert.ok(!serializado.includes(a.description), `la pista de "${a.name}" se filtro`);
  }
  const madrugador = achievementsFor(VACIO).find((a) => a.id === "madrugador");
  assert.equal(madrugador.name, "???");
  assert.equal(madrugador.description, "Un logro secreto");
  assert.equal(madrugador.unlocked, false);
  assert.equal(madrugador.target, 1);
});

test("un secreto desbloqueado si muestra su nombre", () => {
  const lista = achievementsFor({ ...VACIO, earlyBird: true });
  const madrugador = lista.find((a) => a.id === "madrugador");
  assert.equal(madrugador.name, "Madrugador");
  assert.equal(madrugador.unlocked, true);
  assert.equal(madrugador.current, 1);
});

test("los visibles muestran su progreso, topado en el objetivo", () => {
  const lista = achievementsFor({ ...VACIO, lessonsDone: 12 });
  const diez = lista.find((a) => a.id === "diez-lecciones");
  assert.equal(diez.unlocked, true);
  assert.equal(diez.current, 10); // topado: no dice "12 de 10"
  assert.equal(diez.target, 10);
  const veinticinco = lista.find((a) => a.id === "veinticinco-lecciones");
  assert.equal(veinticinco.unlocked, false);
  assert.equal(veinticinco.current, 12);
  assert.equal(veinticinco.target, 25);
});

test("achievementInfo devuelve el nombre REAL, tambien el de un secreto", () => {
  assert.equal(achievementInfo("madrugador").name, "Madrugador");
  assert.equal(achievementInfo("no-existe"), null);
});

test("un secreto desbloqueado con objetivo distinto de 1 reporta su progreso REAL", () => {
  // 'impecable' tiene target 5. Antes reportaba "1 de 1" al desbloquearse.
  const lista = achievementsFor({ ...VACIO, perfectRun: 5 });
  const impecable = lista.find((a) => a.id === "impecable");
  assert.equal(impecable.unlocked, true);
  assert.equal(impecable.name, "Racha impecable");
  assert.equal(impecable.current, 5);
  assert.equal(impecable.target, 5);
});

test("un secreto BLOQUEADO sigue sin revelar su progreso ni su objetivo real", () => {
  // Con perfectRun 4 (a uno de caer), no debe filtrarse ni el 4 ni el 5.
  const lista = achievementsFor({ ...VACIO, perfectRun: 4 });
  const impecable = lista.find((a) => a.id === "impecable");
  assert.equal(impecable.unlocked, false);
  assert.equal(impecable.name, "???");
  assert.equal(impecable.current, 0);   // un "4 de 5" delataria la regla
  assert.equal(impecable.target, 1);
});
