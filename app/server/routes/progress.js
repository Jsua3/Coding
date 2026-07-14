import { Router } from "express";
import { query } from "../db.js";
import { levelFor } from "../services/levels.js";
import { achievementsFor } from "../services/achievements.js";
import { achievementStats, activityByDay, heatmapFrom, weekXpFrom } from "../services/metagame.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const events = await query("SELECT amount FROM xp_events WHERE user_id = ?", [req.userId]);
    const xp = events.reduce((sum, e) => sum + e.amount, 0);
    const stats = await achievementStats(req.userId);
    const byDay = await activityByDay(req.userId);
    // El "día" sale SIEMPRE del reloj de Node, nunca de CURDATE() — misma regla que la racha.
    const today = new Date();

    res.json({
      level: levelFor(xp),
      achievements: achievementsFor(stats),
      heatmap: heatmapFrom(byDay, 365, today),
      weekXp: weekXpFrom(byDay, today),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
