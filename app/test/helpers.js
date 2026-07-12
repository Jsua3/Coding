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
  await query("TRUNCATE TABLE xp_events");
  await query("TRUNCATE TABLE lesson_completions");
  await query("TRUNCATE TABLE users");
  await query("SET FOREIGN_KEY_CHECKS = 1");
}

export { query, closeDb };
