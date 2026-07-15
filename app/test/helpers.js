import "dotenv/config";
process.env.DB_NAME = "coding_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-test";

import { initDb, query, closeDb } from "../server/db.js";
import { runSeed } from "../server/seed.js";

export async function setupTestDb() {
  await initDb({ seed: false });
  await runSeed();
}

export async function resetUserData() {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("TRUNCATE TABLE answer_attempts");
  await query("TRUNCATE TABLE xp_events");
  await query("TRUNCATE TABLE lesson_completions");
  await query("TRUNCATE TABLE streak_shields");
  await query("TRUNCATE TABLE users");
  await query("SET FOREIGN_KEY_CHECKS = 1");
}

export { query, closeDb };

export async function correctResponseFor(exerciseId) {
  const [row] = await query("SELECT type, answer FROM exercises WHERE id = ?", [exerciseId]);
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  if (row.type === "choice") return { index: answer.index };
  if (row.type === "blanks") return { blanks: answer.blanks };
  if (row.type === "order") return { order: answer.order };
  return { pairs: answer.pairs };
}

export async function wrongResponseFor(exerciseId) {
  const [row] = await query("SELECT type, payload, answer FROM exercises WHERE id = ?", [exerciseId]);
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  if (row.type === "choice") return { index: (answer.index + 1) % payload.options.length };
  if (row.type === "blanks") return { blanks: [...answer.blanks].reverse() };
  if (row.type === "order") return { order: [...answer.order].reverse() };
  return { pairs: answer.pairs.map(([l], i, arr) => [l, arr[(i + 1) % arr.length][1]]) };
}
