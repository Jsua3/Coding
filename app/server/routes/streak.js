import { Router } from "express";
import { protectStreak } from "../services/streak.js";

const router = Router();

router.post("/protect", async (req, res, next) => {
  try {
    const result = await protectStreak(req.userId);
    res.json(result);
  } catch (e) {
    // protectStreak marca los errores esperados con .status = 400 y un mensaje en español.
    if (e && e.status === 400) return res.status(400).json({ error: e.message });
    next(e);
  }
});

export default router;
