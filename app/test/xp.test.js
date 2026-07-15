import test from "node:test";
import assert from "node:assert/strict";
import { SHIELD_COST, earnedXp, balanceXp } from "../server/services/xp.js";

test("SHIELD_COST es 50 (una lección)", () => {
  assert.equal(SHIELD_COST, 50);
});

test("earnedXp suma solo los eventos positivos", () => {
  const events = [{ amount: 50 }, { amount: 10 }, { amount: -50 }, { amount: 5 }];
  assert.equal(earnedXp(events), 65); // 50+10+5, el -50 no cuenta
});

test("balanceXp suma todo, incluidos los negativos", () => {
  const events = [{ amount: 50 }, { amount: 10 }, { amount: -50 }, { amount: 5 }];
  assert.equal(balanceXp(events), 15); // 50+10-50+5
});

test("sin eventos, ambos son 0", () => {
  assert.equal(earnedXp([]), 0);
  assert.equal(balanceXp([]), 0);
});
