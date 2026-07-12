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

after(closeDb);
