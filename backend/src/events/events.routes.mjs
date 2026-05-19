import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { uploadProposalPdf } from "../shared/upload.middleware.mjs";
import * as eventsController from "./events.controller.mjs";

const router = Router();

// ─Lead routes
// GET /api/events/lead/dashboard  — dashboard summary (events + alert)
router.get(
    "/lead/dashboard",
    authenticate,
    requireRole("lead"),
    eventsController.getDashboardHandler
);

// GET /api/events/lead  — all events for the lead (filterable by ?status=)
router.get(
    "/lead",
    authenticate,
    requireRole("lead"),
    eventsController.getLeadEventsHandler
);

// POST /api/events  — create a new event (draft or submitted)
router.post(
    "/",
    authenticate,
    requireRole("lead"),
    eventsController.createEventHandler
);

// PATCH /api/events/:eventId/volunteering  — toggle volunteering open/closed
router.patch(
    "/:eventId/volunteering",
    authenticate,
    requireRole("lead"),
    eventsController.toggleVolunteeringHandler
);

// PATCH /api/events/:eventId/volunteers/:applicationId/decision  — accept/reject applicant
router.patch(
    "/:eventId/volunteers/:applicationId/decision",
    authenticate,
    requireRole("lead"),
    eventsController.decideVolunteerApplicationHandler
);

// GET /api/events/:eventId  — single event detail (lead-owned)
router.get(
    "/:eventId",
    authenticate,
    requireRole("lead", "admin"),
    eventsController.getEventHandler
);

// PATCH /api/events/:eventId  — update event fields
router.patch(
    "/:eventId",
    authenticate,
    requireRole("lead"),
    eventsController.updateEventHandler
);

// DELETE /api/events/:eventId  — delete a draft proposal
router.delete(
    "/:eventId",
    authenticate,
    requireRole("lead"),
    eventsController.deleteEventHandler
);

// POST /api/events/:eventId/proposal-pdf  — upload PDF for a draft/pending proposal
router.post(
    "/:eventId/proposal-pdf",
    authenticate,
    requireRole("lead"),
    uploadProposalPdf,
    eventsController.uploadProposalPdfHandler
);

// POST /api/events/:eventId/submit  — draft → submitted
router.post(
    "/:eventId/submit",
    authenticate,
    requireRole("lead"),
    eventsController.submitProposalHandler
);

// Admin routes 
// GET /api/events  — all events (admin overview)
router.get(
    "/",
    authenticate,
    requireRole("admin"),
    eventsController.getAllEventsHandler
);

// PATCH /api/events/:eventId/decision  — approve or reject a proposal
router.patch(
    "/:eventId/decision",
    authenticate,
    requireRole("admin"),
    eventsController.decideProposalHandler
);

export default router;
