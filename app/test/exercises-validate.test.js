import test from "node:test";
import assert from "node:assert/strict";
import { validateResponse } from "../server/services/exercises.js";

const choiceP = { options: ["a", "b", "c", "d"] };
const choiceA = { index: 2 };

test("choice: correcta, incorrecta y malformada", () => {
  assert.deepEqual(validateResponse("choice", choiceP, choiceA, { index: 2 }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("choice", choiceP, choiceA, { index: 0 }), { valid: true, correct: false });
  for (const bad of [null, {}, { index: -1 }, { index: 4 }, { index: "2" }, { index: 1.5 }]) {
    assert.equal(validateResponse("choice", choiceP, choiceA, bad).valid, false, JSON.stringify(bad));
  }
});

const blanksP = { code: ["<b0> x <b1>"], bank: ["WHERE", "ASC", "DESC"] };
const blanksA = { blanks: ["WHERE", "ASC"] };

test("blanks: exacto por hueco", () => {
  assert.deepEqual(validateResponse("blanks", blanksP, blanksA, { blanks: ["WHERE", "ASC"] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("blanks", blanksP, blanksA, { blanks: ["ASC", "WHERE"] }), { valid: true, correct: false });
  for (const bad of [{}, { blanks: ["WHERE"] }, { blanks: ["WHERE", 3] }, { blanks: "WHERE,ASC" }]) {
    assert.equal(validateResponse("blanks", blanksP, blanksA, bad).valid, false, JSON.stringify(bad));
  }
});

const orderP = { lines: [{ id: "a", html: "x" }, { id: "b", html: "y" }, { id: "c", html: "z" }] };
const orderA = { order: ["b", "a", "c"] };

test("order: secuencia exacta, ids válidos y sin repetidos", () => {
  assert.deepEqual(validateResponse("order", orderP, orderA, { order: ["b", "a", "c"] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("order", orderP, orderA, { order: ["a", "b", "c"] }), { valid: true, correct: false });
  for (const bad of [{}, { order: ["b", "a"] }, { order: ["b", "a", "x"] }, { order: ["b", "b", "c"] }]) {
    assert.equal(validateResponse("order", orderP, orderA, bad).valid, false, JSON.stringify(bad));
  }
});

const matchP = { left: ["1", "2", "3", "4"], right: ["w", "x", "y", "z"] };
const matchA = { pairs: [[0, 1], [1, 0], [2, 3], [3, 2]] };

test("match: conjunto completo de pares", () => {
  assert.deepEqual(validateResponse("match", matchP, matchA, { pairs: [[1, 0], [0, 1], [3, 2], [2, 3]] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("match", matchP, matchA, { pairs: [[0, 0], [1, 1], [2, 2], [3, 3]] }), { valid: true, correct: false });
  for (const bad of [{}, { pairs: [[0, 1]] }, { pairs: [[0, 1], [0, 2], [2, 3], [3, 0]] }, { pairs: [[0, 9], [1, 0], [2, 3], [3, 2]] }, { pairs: [["0", 1], [1, 0], [2, 3], [3, 2]] }]) {
    assert.equal(validateResponse("match", matchP, matchA, bad).valid, false, JSON.stringify(bad));
  }
});

test("tipo desconocido es inválido", () => {
  assert.equal(validateResponse("essay", {}, {}, {}).valid, false);
});
