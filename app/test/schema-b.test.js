import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

test("users tiene daily_goal con default 50", async () => {
  await query("INSERT INTO users (name, email, password_hash) VALUES ('Ana', 'ana@test.dev', 'x')");
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 50);
});

test("streak_shields existe y es única por (user, día)", async () => {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('Leo', 'leo@test.dev', 'x')");
  const id = r.insertId;
  await query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, '2026-07-10')", [id]);
  await assert.rejects(
    () => query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, '2026-07-10')", [id]),
    /ER_DUP_ENTRY|Duplicate/
  );
});
