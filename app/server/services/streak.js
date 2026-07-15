import { query, getPool } from "../db.js";
import { currentStreak, bestStreak, repairableGap, toDayString } from "./gamification.js";
import { SHIELD_COST, balanceXp } from "./xp.js";

export const PROTECT_WINDOW_DAYS = 2;

export async function protectedDaysFor(userId) {
  const rows = await query("SELECT protected_day FROM streak_shields WHERE user_id = ?", [userId]);
  return rows.map((r) => toDayString(r.protected_day));
}

export async function balanceXpFor(userId) {
  const rows = await query("SELECT amount FROM xp_events WHERE user_id = ?", [userId]);
  return balanceXp(rows);
}

// Un día cuenta si tuviste actividad O lo protegiste: se le pasa la unión a las funciones puras,
// que no cambian por dentro.
export async function streakStateFor(userId) {
  const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [userId]);
  const activeDays = completions.map((r) => toDayString(r.completed_at));
  const protectedDays = await protectedDaysFor(userId);
  const credited = [...activeDays, ...protectedDays];
  const today = toDayString(new Date());
  const gap = repairableGap(new Set(activeDays), new Set(protectedDays), today, PROTECT_WINDOW_DAYS);
  return {
    current: currentStreak(credited, today),
    best: bestStreak(credited),
    repairable: gap ? { days: gap.days, totalCost: gap.days.length * SHIELD_COST } : null,
  };
}

// El servidor RECALCULA el hueco: jamás confía en qué días dice el cliente proteger.
export async function protectStreak(userId) {
  const state = await streakStateFor(userId);
  if (!state.repairable) {
    const e = new Error("Ya no puedes recuperar esta racha");
    e.status = 400;
    throw e;
  }
  const totalCost = state.repairable.totalCost;
  const balance = await balanceXpFor(userId);
  if (balance < totalCost) {
    const e = new Error("No tienes suficiente XP para proteger tu racha");
    e.status = 400;
    throw e;
  }
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const day of state.repairable.days) {
      await conn.query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, ?)", [userId, day]);
    }
    await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, NULL, ?)", [userId, -totalCost]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    // Doble submit: otra petición ya protegió estos días. No cobramos de nuevo; devolvemos el estado real.
    if (!(e && e.code === "ER_DUP_ENTRY")) throw e;
  } finally {
    conn.release();
  }
  return { streak: await streakStateFor(userId), balance: await balanceXpFor(userId) };
}
