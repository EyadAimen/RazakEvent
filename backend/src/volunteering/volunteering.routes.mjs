import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as volunteeringController from "./volunteering.controller.mjs";

const router = Router();

// Student — browse open events with their roles
router.get(
    "/events",
    authenticate,
    requireRole("student", "member"),
    volunteeringController.getOpenEventsHandler,
);

// Lead — create a role for an event
router.post(
    "/events/:eventId/roles",
    authenticate,
    requireRole("lead"),
    volunteeringController.createRoleHandler,
);

// Lead — update a role
router.patch(
    "/roles/:roleId",
    authenticate,
    requireRole("lead"),
    volunteeringController.updateRoleHandler,
);

// Lead — delete a role (cascade drops all applications)
router.delete(
    "/roles/:roleId",
    authenticate,
    requireRole("lead"),
    volunteeringController.deleteRoleHandler,
);

// Student — view own applications (fixed path — must be before /:applicationId)
router.get(
    "/applications/mine",
    authenticate,
    requireRole("student", "member"),
    volunteeringController.getMyApplicationsHandler,
);

// Student — apply to a role
router.post(
    "/applications",
    authenticate,
    requireRole("student", "member"),
    volunteeringController.applyToRoleHandler,
);

// Lead — get all volunteer applications for their club
router.get(
    "/applications/club",
    authenticate,
    requireRole("lead"),
    volunteeringController.getClubVolunteerApplicationsHandler,
);

// Lead — decide on an application (accept/reject)
router.patch(
    "/applications/:applicationId/decision",
    authenticate,
    requireRole("lead"),
    volunteeringController.decideApplicationHandler,
);

export default router;
