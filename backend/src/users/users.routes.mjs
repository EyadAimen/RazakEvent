import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";

const router = Router();

router.get("/", authenticate, requireRole("admin"), (req, res) => {
    res.json({ message: "ok" });
});

router.patch("/:id/role", authenticate, requireRole("admin"), (req, res) => {
    res.json({ message: "ok" });
});

export default router;
