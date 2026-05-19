import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";

const router = Router();

router.get("/", authenticate, requireRole("student"), (req, res) => {
    res.json({ message: "ok" });
});

router.post("/apply", authenticate, requireRole("student"), (req, res) => {
    res.json({ message: "ok" });
});

export default router;
