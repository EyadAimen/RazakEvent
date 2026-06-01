import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { uploadProposalPdf } from "../shared/upload.middleware.mjs";
import * as eventsController from "./events.controller.mjs";

const router = Router();

// Shared events (from events table) – accessible by any authenticated user
router.get("/shared", authenticate, eventsController.getStudentEventsHandler);

// Lead routes
router.get("/lead/dashboard", authenticate, requireRole("lead"), eventsController.getDashboardHandler);
router.get("/lead", authenticate, requireRole("lead"), eventsController.getLeadEventsHandler);
router.post("/", authenticate, requireRole("lead"), eventsController.createEventHandler);
router.patch("/:eventId/volunteering", authenticate, requireRole("lead"), eventsController.toggleVolunteeringHandler);
router.get("/:eventId", authenticate, requireRole("lead", "admin"), eventsController.getEventHandler);
router.patch("/:eventId", authenticate, requireRole("lead"), eventsController.updateEventHandler);
router.delete("/:eventId", authenticate, requireRole("lead"), eventsController.deleteEventHandler);
router.post("/:eventId/proposal-pdf", authenticate, requireRole("lead"), uploadProposalPdf, eventsController.uploadProposalPdfHandler);
router.post("/:eventId/submit", authenticate, requireRole("lead"), eventsController.submitProposalHandler);

// Admin routes
router.get("/", authenticate, requireRole("admin"), eventsController.getAllEventsHandler);
router.patch("/:eventId/decision", authenticate, requireRole("admin"), eventsController.decideProposalHandler);

// Student routes (public detail, list already at /shared)
router.get("/student", authenticate, eventsController.getStudentEventsHandler);
router.get("/student/:eventId", authenticate, eventsController.getStudentEventHandler);

export default router;