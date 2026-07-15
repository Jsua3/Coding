import { Router } from "express";
import { query } from "../db.js";
import { initials } from "../auth.js";
import { weeklyXp, toDayString } from "../services/gamification.js";
import { coursesForUser, findContinue } from "../services/progress.js";
import { reviewCount } from "../services/review.js";
import { levelFor } from "../services/levels.js";
import { earnedXp, balanceXp } from "../services/xp.js";
import { streakStateFor } from "../services/streak.js";

const router = Router();

export const DAILY_GOAL_OPTIONS = [20, 50, 100, 150];

router.put("/daily-goal", async (req, res, next) => {
  try {
    const goal = req.body && req.body.goal;
    if (!DAILY_GOAL_OPTIONS.includes(goal)) {
      return res.status(400).json({ error: "Esa meta no es válida" });
    }
    await query("UPDATE users SET daily_goal = ? WHERE id = ?", [goal, req.userId]);
    res.json({ dailyGoal: goal });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const users = await query("SELECT id, name, email, daily_goal, created_at FROM users WHERE id = ?", [req.userId]);
    if (!users.length) return res.status(401).json({ error: "Tu sesión expiró, inicia sesión de nuevo" });
    const user = users[0];

    const events = await query("SELECT amount, created_at FROM xp_events WHERE user_id = ?", [req.userId]);
    const courses = await coursesForUser(req.userId);

    const xp = earnedXp(events);                 // ganado: alimenta el nivel y el "XP total"
    const balance = balanceXp(events);           // saldo gastable
    const lvl = levelFor(xp);
    const today = toDayString(new Date());
    const xpToday = events
      .filter((e) => e.amount > 0 && toDayString(e.created_at) === today)
      .reduce((sum, e) => sum + e.amount, 0);
    const streakState = await streakStateFor(req.userId);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, initials: initials(user.name), createdAt: user.created_at },
      stats: {
        xp,
        level: { n: lvl.n, name: lvl.name, progress: lvl.progress },
        xpWeek: weeklyXp(events),
        streak: streakState.current,
        bestStreak: streakState.best,
        dailyGoal: user.daily_goal,
        xpToday,
        balance,
        activeCourses: courses.filter((c) => c.status === "EN CURSO").length,
        completedCourses: courses.filter((c) => c.status === "COMPLETADO").length,
        lockedCourses: courses.filter((c) => c.status === "BLOQUEADO").length,
        reviewCount: await reviewCount(req.userId),
      },
      continue: await findContinue(req.userId),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
