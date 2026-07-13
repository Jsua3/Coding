import { Router } from "express";
import { pendingReview, reviewCount } from "../services/review.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({
      count: await reviewCount(req.userId),
      exercises: await pendingReview(req.userId, 10),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
