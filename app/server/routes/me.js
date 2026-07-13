import { Router } from "express";
import { query } from "../db.js";
import { initials } from "../auth.js";
import { currentStreak, bestStreak, weeklyXp, toDayString } from "../services/gamification.js";
import { coursesForUser, findContinue } from "../services/progress.js";
import { reviewCount } from "../services/review.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await query("SELECT id, name, email FROM users WHERE id = ?", [req.userId]);
    if (!users.length) return res.status(401).json({ error: "Tu sesión expiró, inicia sesión de nuevo" });
    const user = users[0];

    const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId]);
    const days = completions.map((r) => toDayString(r.completed_at));
    const events = await query("SELECT amount, created_at FROM xp_events WHERE user_id = ?", [req.userId]);
    const courses = await coursesForUser(req.userId);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, initials: initials(user.name) },
      stats: {
        xp: events.reduce((sum, e) => sum + e.amount, 0),
        xpWeek: weeklyXp(events),
        streak: currentStreak(days, toDayString(new Date())),
        bestStreak: bestStreak(days),
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
