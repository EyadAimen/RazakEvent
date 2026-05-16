import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";

const router = Router();

router.get("/", authenticate, (req, res) => {
    res.json({ message: "ok" });
});

router.get("/:id", authenticate, (req, res) => {
    res.json({ message: "ok" });
});

router.post("/", authenticate, requireRole("admin"), (req, res) => {
    res.json({ message: "ok" });
});

export default router;
