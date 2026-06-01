import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { uploadProposalPdf } from "../shared/upload.middleware.mjs";
import * as eventsController from "./events.controller.mjs";

const router = Router();

// Shared events (from events table) – accessible by any authenticated user
router.get("/shared", authenticate, eventsController.getStudentEventsHandler);

// Admin routes
router.get("/", authenticate, requireRole("admin"), eventsController.getAllEventsHandler);
router.post("/admin", authenticate, requireRole("admin"), eventsController.createApprovedEventByAdminHandler);
router.patch("/admin/:eventId", authenticate, requireRole("admin"), eventsController.updateApprovedEventByAdminHandler);
router.delete("/admin/:eventId", authenticate, requireRole("admin"), eventsController.deleteApprovedEventByAdminHandler);
router.patch("/:eventId/decision", authenticate, requireRole("admin"), eventsController.decideProposalHandler);

// Lead routes with :eventId after admin routes
router.patch("/:eventId/volunteering", authenticate, requireRole("lead"), eventsController.toggleVolunteeringHandler);
router.patch("/:eventId/volunteers/:applicationId/decision", authenticate, requireRole("lead"), eventsController.decideVolunteerApplicationHandler);
router.get("/:eventId", authenticate, requireRole("lead", "admin"), eventsController.getEventHandler);
router.patch("/:eventId", authenticate, requireRole("lead"), eventsController.updateEventHandler);
router.delete("/:eventId", authenticate, requireRole("lead"), eventsController.deleteEventHandler);
router.post("/:eventId/proposal-pdf", authenticate, requireRole("lead"), uploadProposalPdf, eventsController.uploadProposalPdfHandler);
router.post("/:eventId/submit", authenticate, requireRole("lead"), eventsController.submitProposalHandler);

// Student routes (public detail, list already at /shared)
router.get("/student", authenticate, eventsController.getStudentEventsHandler);
router.get("/student/:eventId", authenticate, eventsController.getStudentEventHandler);

export default router;