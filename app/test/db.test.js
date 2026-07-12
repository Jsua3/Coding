import test, { after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, query, closeDb } from "./helpers.js";

test("initDb crea las 7 tablas", async () => {
  await setupTestDb();
  const rows = await query("SHOW TABLES");
  const names = rows.map((r) => Object.values(r)[0]);
  for (const t of ["users", "courses", "units", "lessons", "quiz_questions", "lesson_completions", "xp_events"]) {
    assert.ok(names.includes(t), `falta la tabla ${t}`);
  }
});

test("initDb es idempotente", async () => {
  await setupTestDb();
  await setupTestDb();
});

after(closeDb);
