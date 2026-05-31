import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as clubsController from "./clubs.controller.mjs";
import { uploadClubLetter } from "../shared/upload.middleware.mjs";

const router = Router();

// Any authenticated user — used by signup and become-lead dropdowns
router.get("/", authenticate, clubsController.listClubsHandler);

// Lead — must be registered before /:param routes to avoid "mine" being matched as a param
router.get("/mine", authenticate, requireRole("lead"), clubsController.getMyClubHandler);
router.get("/mine/members", authenticate, requireRole("lead"), clubsController.getMyClubMembersHandler);
router.get("/mine/membership-requests", authenticate, requireRole("lead"), clubsController.getMembershipRequestsHandler);
router.get("/mine", authenticate, requireRole("lead"), clubsController.getMyClubHandler);
router.get("/mine/all", authenticate, requireRole("lead"), clubsController.getMyClubsHandler);
router.get("/mine/members", authenticate, requireRole("lead"), clubsController.getMyClubMembersHandler);
router.get("/mine/membership-requests", authenticate, requireRole("lead"), clubsController.getMembershipRequestsHandler);
router.patch("/mine/membership-requests/:requestId/decision", authenticate, requireRole("lead"), clubsController.decideMembershipRequestHandler);
router.delete("/mine/members/:userId", authenticate, requireRole("lead"), clubsController.removeMemberHandler);

// Any authenticated user — submit a new club / community request
router.post("/requests", authenticate, uploadClubLetter, clubsController.createClubRequestHandler);

// Admin only
// Admin only
router.get("/requests", authenticate, requireRole("admin"), clubsController.listClubRequestsHandler);
router.get("/requests/:requestId", authenticate, requireRole("admin"), clubsController.getClubRequestHandler);
router.patch("/requests/:requestId/decision", authenticate, requireRole("admin"), clubsController.decideClubRequestHandler);

router.get("/users/available", authenticate, requireRole("admin"), clubsController.listUsersWithoutClubHandler);

router.get("/:clubId/members", authenticate, clubsController.getClubMembersByClubIdHandler);
router.patch("/:clubId", authenticate, requireRole("admin"), clubsController.updateClubDetailsByAdminHandler);
router.post("/:clubId/members", authenticate, requireRole("admin"), clubsController.addClubMemberByAdminHandler);
router.delete("/:clubId/members/:userId", authenticate, requireRole("admin"), clubsController.removeClubMemberByAdminHandler);
router.patch("/:clubId/lead", authenticate, requireRole("admin"), clubsController.changeClubLeadByAdminHandler);
router.get("/:clubId/events", authenticate, clubsController.getClubEventsByClubIdHandler);
router.delete("/:clubId", authenticate, requireRole("admin"), clubsController.deleteClubHandler);

// Lead only
router.get("/mine", authenticate, requireRole("lead"), clubsController.getMyClubHandler);
router.get("/mine/members", authenticate, requireRole("lead"), clubsController.getMyClubMembersHandler);
router.get("/mine/membership-requests", authenticate, requireRole("lead"), clubsController.getMembershipRequestsHandler);
router.patch("/mine/membership-requests/:requestId/decision", authenticate, requireRole("lead"), clubsController.decideMembershipRequestHandler);
router.delete("/mine/members/:userId", authenticate, requireRole("lead"), clubsController.removeMemberHandler);

export default router;
