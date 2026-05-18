import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as clubsController from "./clubs.controller.mjs";

const router = Router();

// Any authenticated user — used by signup and become-lead dropdowns
router.get("/", authenticate, clubsController.listClubsHandler);

// Admin only
// IMPORTANT: if a future student route GET /requests/mine is added, register it
// BEFORE the /:requestId route to prevent "mine" being matched as a param.
router.get("/requests", authenticate, requireRole("admin"), clubsController.listClubRequestsHandler);
router.get("/requests/:requestId", authenticate, requireRole("admin"), clubsController.getClubRequestHandler);
router.patch("/requests/:requestId/decision", authenticate, requireRole("admin"), clubsController.decideClubRequestHandler);

export default router;
