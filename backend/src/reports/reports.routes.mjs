import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";

const router = Router();

router.post("/", authenticate, requireRole("lead"), (req, res) => {
    res.json({ message: "ok" });
});

router.get("/", authenticate, requireRole("admin", "lead"), (req, res) => {
    res.json({ message: "ok" });
});

export default router;
