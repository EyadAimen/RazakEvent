import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { getAllProposals, reviewProposal } from "./proposals.controller.mjs";

const router = Router();

router.post("/", authenticate, requireRole("lead"), (req, res) => {
    res.json({ message: "ok" });
});

router.get("/", authenticate, requireRole("admin"), getAllProposals);

router.patch("/:id/decision", authenticate, requireRole("admin"), reviewProposal);

export default router;