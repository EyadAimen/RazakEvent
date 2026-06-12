
import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { getAllProposals, reviewProposal } from "./proposals.controller.mjs";

const router = Router();

router.get("/", authenticate, getAllProposals);

router.patch("/:id/decision", authenticate, requireRole("admin"), reviewProposal);

export default router;