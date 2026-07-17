import test, { after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, query, closeDb } from "./helpers.js";

test("seed inserta bd1 y bd2 con estructura válida", async () => {
  await setupTestDb();
  const bd1 = await query("SELECT * FROM courses WHERE id = 'bd1'");
  assert.equal(bd1.length, 1);
  assert.equal(bd1[0].prereq_course_id, null);
  const bd2 = await query("SELECT * FROM courses WHERE id = 'bd2'");
  assert.equal(bd2[0].prereq_course_id, "bd1");

  const bd1Lessons = await query(
    "SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = 'bd1'"
  );
  assert.equal(bd1Lessons.length, 10);
  const bd2Lessons = await query(
    "SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = 'bd2'"
  );
  assert.equal(bd2Lessons.length, 9);

  const [ex1] = await query("SELECT * FROM exercises WHERE id = 'l5-ex1'");
  const answer = typeof ex1.answer === "string" ? JSON.parse(ex1.answer) : ex1.answer;
  assert.equal(answer.index, 1);
  assert.match(ex1.prompt, /promedio/);
});

test("toda lección sembrada tiene contenido y su ejercicio choice bien formado", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT l.id, l.content, e.payload, e.answer
     FROM lessons l LEFT JOIN exercises e ON e.lesson_id = l.id AND e.order_index = 0`
  );
  for (const row of rows) {
    const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
    assert.ok(Array.isArray(content) && content.length >= 2, `contenido corto en ${row.id}`);
    assert.notEqual(row.payload, null, `falta ejercicio choice en ${row.id}`);
    const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
    assert.equal(payload.options.length, 4, `opciones en ${row.id}`);
    assert.ok(answer.index >= 0 && answer.index <= 3, `answer.index en ${row.id}`);
  }
});

test("el seed es idempotente (upsert por id)", async () => {
  await setupTestDb();
  await setupTestDb();
  const rows = await query("SELECT COUNT(*) AS n FROM courses");
  assert.ok(rows[0].n >= 2);
});

test("seed completo: 7 cursos, 71 lecciones, 142 ejercicios", async () => {
  await setupTestDb();
  const courses = await query("SELECT id FROM courses");
  assert.equal(courses.length, 7);
  const lessons = await query("SELECT COUNT(*) AS n FROM lessons");
  assert.equal(lessons[0].n, 71);
  const exercises = await query("SELECT COUNT(*) AS n FROM exercises");
  assert.equal(exercises[0].n, 142);
  const perCourse = await query(
    `SELECT u.course_id, COUNT(l.id) AS n FROM lessons l JOIN units u ON u.id = l.unit_id GROUP BY u.course_id`
  );
  const counts = Object.fromEntries(perCourse.map((r) => [r.course_id, r.n]));
  assert.deepEqual(counts, { bd1: 10, bd2: 9, prog1: 12, prog2: 9, algo: 12, web: 12, reqsw: 7 });
});

export function assertExerciseShape(row) {
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  assert.ok(row.prompt.length > 0, `prompt vacío en ${row.id}`);
  assert.ok(row.explain_ok.length > 0 && row.explain_bad.length > 0, `explicaciones en ${row.id}`);
  if (row.type === "choice") {
    assert.equal(payload.options.length, 4, `opciones en ${row.id}`);
    assert.ok(Number.isInteger(answer.index) && answer.index >= 0 && answer.index <= 3, `answer.index en ${row.id}`);
  } else if (row.type === "blanks") {
    const holes = payload.code.join("\n").match(/<b\d+>/g) || [];
    assert.equal(holes.length, answer.blanks.length, `huecos vs respuestas en ${row.id}`);
    assert.ok(answer.blanks.length >= 2, `mínimo 2 huecos en ${row.id}`);
    assert.equal(new Set(answer.blanks).size, answer.blanks.length, `ficha repetida en answer de ${row.id}`);
    assert.ok(answer.blanks.every((b) => payload.bank.includes(b)), `answer fuera del bank en ${row.id}`);
    assert.ok(payload.bank.length > answer.blanks.length, `sin distractores en ${row.id}`);
    assert.equal(new Set(payload.bank).size, payload.bank.length, `fichas repetidas en ${row.id}`);
  } else if (row.type === "order") {
    const ids = payload.lines.map((l) => l.id);
    assert.deepEqual([...ids].sort(), [...answer.order].sort(), `ids payload vs answer en ${row.id}`);
    assert.notDeepEqual(ids, answer.order, `lines ya en orden correcto en ${row.id}`);
  } else if (row.type === "match") {
    assert.equal(payload.left.length, 4, `left en ${row.id}`);
    assert.equal(payload.right.length, 4, `right en ${row.id}`);
    assert.equal(answer.pairs.length, 4, `pairs en ${row.id}`);
    const identity = answer.pairs.every(([l, r]) => l === r);
    assert.ok(!identity, `right sin mezclar en ${row.id}`);
  } else {
    assert.fail(`tipo desconocido ${row.type} en ${row.id}`);
  }
}

test("bd1 y bd2: 2 ejercicios por lección, bien formados", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT e.*, u.course_id FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id JOIN units u ON u.id = l.unit_id
     WHERE u.course_id IN ('bd1','bd2') ORDER BY e.lesson_id, e.order_index`
  );
  const byLesson = {};
  for (const r of rows) (byLesson[r.lesson_id] = byLesson[r.lesson_id] || []).push(r);
  assert.equal(Object.keys(byLesson).length, 19);
  for (const [lessonId, exs] of Object.entries(byLesson)) {
    assert.equal(exs.length, 2, `ejercicios en ${lessonId}`);
    assert.equal(exs[0].id, lessonId + "-ex1");
    assert.equal(exs[0].type, "choice");
    assert.equal(exs[1].id, lessonId + "-ex2");
    assert.notEqual(exs[1].type, "choice", `ex2 debe ser estructurado en ${lessonId}`);
    for (const e of exs) assertExerciseShape(e);
  }
});

test("prog1 y prog2: toda lección tiene su ejercicio extra", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT COUNT(*) AS n FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id JOIN units u ON u.id = l.unit_id
     WHERE u.course_id IN ('prog1','prog2') AND e.order_index = 1`
  );
  assert.equal(rows[0].n, 21);
});

test("reqsw: 7 lecciones en 2 unidades, 2 ejercicios por lección, bien formados", async () => {
  await setupTestDb();
  const lessons = await query(
    `SELECT l.id, l.content, u.id AS unit_id FROM lessons l JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'reqsw' ORDER BY u.order_index, l.order_index`
  );
  assert.equal(lessons.length, 7);
  const byUnit = {};
  for (const l of lessons) (byUnit[l.unit_id] = byUnit[l.unit_id] || []).push(l);
  assert.equal(Object.keys(byUnit).length, 2, "reqsw debe tener 2 unidades");
  const unitSizes = Object.values(byUnit).map((ls) => ls.length).sort((a, b) => a - b);
  assert.deepEqual(unitSizes, [2, 5], "reparto 2 + 5 entre las unidades de reqsw");
  for (const l of lessons) {
    const content = typeof l.content === "string" ? JSON.parse(l.content) : l.content;
    assert.ok(Array.isArray(content) && content.length > 0, `contenido vacío en ${l.id}`);
  }

  const rows = await query(
    `SELECT e.* FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'reqsw' ORDER BY e.lesson_id, e.order_index`
  );
  const byLesson = {};
  for (const r of rows) (byLesson[r.lesson_id] = byLesson[r.lesson_id] || []).push(r);
  assert.equal(Object.keys(byLesson).length, 7);
  for (const [lessonId, exs] of Object.entries(byLesson)) {
    assert.equal(exs.length, 2, `ejercicios en ${lessonId}`);
    assert.equal(exs[0].id, lessonId + "-ex1");
    assert.equal(exs[0].type, "choice");
    assert.equal(exs[1].id, lessonId + "-ex2");
    assert.notEqual(exs[1].type, "choice", `ex2 debe ser estructurado en ${lessonId}`);
    for (const e of exs) assertExerciseShape(e);
  }

  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  // match (rq2, rq3, rq4, rq6): pares completos — left y right cubren los 4 índices sin repetir
  for (const id of ["rq2-ex2", "rq3-ex2", "rq4-ex2", "rq6-ex2"]) {
    const row = byId[id];
    assert.equal(row.type, "match", `${id} debe ser match`);
    const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
    const lefts = answer.pairs.map(([l]) => l).sort();
    const rights = answer.pairs.map(([, r]) => r).sort();
    assert.deepEqual(lefts, [0, 1, 2, 3], `pares left sin repetir en ${id}`);
    assert.deepEqual(rights, [0, 1, 2, 3], `pares right sin repetir en ${id}`);
  }

  // blanks (rq5): cada respuesta vive en el banco, con al menos 2 distractores
  const rq5 = byId["rq5-ex2"];
  assert.equal(rq5.type, "blanks", "rq5-ex2 debe ser blanks");
  const rq5Payload = typeof rq5.payload === "string" ? JSON.parse(rq5.payload) : rq5.payload;
  const rq5Answer = typeof rq5.answer === "string" ? JSON.parse(rq5.answer) : rq5.answer;
  assert.ok(rq5Answer.blanks.every((b) => rq5Payload.bank.includes(b)), "respuestas de rq5 fuera del banco");
  assert.ok(rq5Payload.bank.length >= rq5Answer.blanks.length + 2, "rq5 necesita al menos 2 distractores");

  // order (rq1, rq7): answer.order es permutación de payload.lines, y el payload llega mezclado
  for (const id of ["rq1-ex2", "rq7-ex2"]) {
    const row = byId[id];
    assert.equal(row.type, "order", `${id} debe ser order`);
    const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
    const payloadIds = payload.lines.map((l) => l.id);
    assert.deepEqual([...payloadIds].sort(), [...answer.order].sort(), `ids payload vs answer en ${id}`);
    assert.notDeepEqual(payloadIds, answer.order, `payload de ${id} debe llegar mezclado`);
  }
});

test("global: 142 ejercicios, 2 por lección, todos bien formados", async () => {
  await setupTestDb();
  const rows = await query("SELECT * FROM exercises ORDER BY lesson_id, order_index");
  assert.equal(rows.length, 142);
  const byLesson = {};
  for (const r of rows) (byLesson[r.lesson_id] = byLesson[r.lesson_id] || []).push(r);
  assert.equal(Object.keys(byLesson).length, 71);
  for (const exs of Object.values(byLesson)) {
    assert.equal(exs.length, 2);
    assert.equal(exs[0].type, "choice");
    assert.notEqual(exs[1].type, "choice");
    for (const e of exs) assertExerciseShape(e);
  }
});

after(closeDb);
