import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as clubsController from "./clubs.controller.mjs";

const router = Router();

// Any authenticated user — used by signup and become-lead dropdowns
router.get("/", authenticate, clubsController.listClubsHandler);

// Lead — must be registered before /:param routes to avoid "mine" being matched as a param
router.get("/mine",                                           authenticate, requireRole("lead"), clubsController.getMyClubHandler);
router.get("/mine/members",                                   authenticate, requireRole("lead"), clubsController.getMyClubMembersHandler);
router.get("/mine/membership-requests",                       authenticate, requireRole("lead"), clubsController.getMembershipRequestsHandler);
router.patch("/mine/membership-requests/:requestId/decision", authenticate, requireRole("lead"), clubsController.decideMembershipRequestHandler);
router.delete("/mine/members/:userId",                        authenticate, requireRole("lead"), clubsController.removeMemberHandler);

// Admin only
router.get("/requests",                     authenticate, requireRole("admin"), clubsController.listClubRequestsHandler);
router.get("/requests/:requestId",          authenticate, requireRole("admin"), clubsController.getClubRequestHandler);
router.patch("/requests/:requestId/decision", authenticate, requireRole("admin"), clubsController.decideClubRequestHandler);

// Lead only
router.get("/mine",                                          authenticate, requireRole("lead"), clubsController.getMyClubHandler);
router.get("/mine/members",                                  authenticate, requireRole("lead"), clubsController.getMyClubMembersHandler);
router.get("/mine/membership-requests",                      authenticate, requireRole("lead"), clubsController.getMembershipRequestsHandler);
router.patch("/mine/membership-requests/:requestId/decision",authenticate, requireRole("lead"), clubsController.decideMembershipRequestHandler);
router.delete("/mine/members/:userId",                       authenticate, requireRole("lead"), clubsController.removeMemberHandler);

export default router;
