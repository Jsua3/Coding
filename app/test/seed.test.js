import test, { after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, query, closeDb } from "./helpers.js";

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

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

  const [q5] = await query("SELECT * FROM quiz_questions WHERE lesson_id = 'l5'");
  assert.equal(q5.correct_index, 1);
  assert.match(q5.question, /promedio/);
});

test("toda lección sembrada tiene contenido y quiz bien formados", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT l.id, l.content, q.options, q.correct_index
     FROM lessons l LEFT JOIN quiz_questions q ON q.lesson_id = l.id`
  );
  for (const row of rows) {
    const content = parseMaybe(row.content);
    assert.ok(Array.isArray(content) && content.length >= 2, `contenido corto en ${row.id}`);
    assert.notEqual(row.options, null, `falta quiz en ${row.id}`);
    const options = parseMaybe(row.options);
    assert.equal(options.length, 4, `opciones en ${row.id}`);
    assert.ok(row.correct_index >= 0 && row.correct_index <= 3, `correct_index en ${row.id}`);
  }
});

test("el seed es idempotente (upsert por id)", async () => {
  await setupTestDb();
  await setupTestDb();
  const rows = await query("SELECT COUNT(*) AS n FROM courses");
  assert.ok(rows[0].n >= 2);
});

test("seed completo: 6 cursos, 64 lecciones, 64 quizzes", async () => {
  await setupTestDb();
  const courses = await query("SELECT id FROM courses");
  assert.equal(courses.length, 6);
  const lessons = await query("SELECT COUNT(*) AS n FROM lessons");
  assert.equal(lessons[0].n, 64);
  const quizzes = await query("SELECT COUNT(*) AS n FROM quiz_questions");
  assert.equal(quizzes[0].n, 64);
  const perCourse = await query(
    `SELECT u.course_id, COUNT(l.id) AS n FROM lessons l JOIN units u ON u.id = l.unit_id GROUP BY u.course_id`
  );
  const counts = Object.fromEntries(perCourse.map((r) => [r.course_id, r.n]));
  assert.deepEqual(counts, { bd1: 10, bd2: 9, prog1: 12, prog2: 9, algo: 12, web: 12 });
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

after(closeDb);
