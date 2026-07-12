import { Router } from "express";
import { coursesForUser, courseDetail } from "../services/progress.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await coursesForUser(req.userId));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const detail = await courseDetail(req.userId, req.params.id);
    if (!detail) return res.status(404).json({ error: "Esta materia no existe" });
    res.json(detail);
  } catch (e) {
    next(e);
  }
});

export default router;
