import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as leadRoleController from "./lead_role_requests.controller.mjs";

const router = Router();

// Member: submit a request
router.post("/", authenticate, requireRole("member"), leadRoleController.submitLeadRoleRequestHandler);

// IMPORTANT: /mine and /incoming must be registered BEFORE /:id to avoid being captured as a param
router.get("/mine", authenticate, requireRole("member"), leadRoleController.getMyRequestHandler);
router.get("/incoming", authenticate, requireRole("lead"), leadRoleController.getIncomingRequestsHandler);

// Admin: list all and single detail
router.get("/", authenticate, requireRole("admin"), leadRoleController.listLeadRoleRequestsHandler);
router.get("/:id", authenticate, requireRole("admin"), leadRoleController.getLeadRoleRequestHandler);

// Lead decision (stage 1)
router.patch("/:id/lead-decision", authenticate, requireRole("lead"), leadRoleController.decideLeadDecisionHandler);

// Admin decision (stage 2)
router.patch("/:id/admin-decision", authenticate, requireRole("admin"), leadRoleController.decideAdminDecisionHandler);

export default router;
