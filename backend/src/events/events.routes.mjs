import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { uploadProposalPdf } from "../shared/upload.middleware.mjs";
import * as eventsController from "./events.controller.mjs";

const router = Router();

// ── Shared (any authenticated user) ──────────────────────────────────────────
router.get("/shared", authenticate, eventsController.getStudentEventsHandler);
router.get("/shared/:eventId", authenticate, eventsController.getStudentEventHandler);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/", authenticate, requireRole("admin"), eventsController.getAllEventsHandler);
router.post("/admin", authenticate, requireRole("admin"), eventsController.createApprovedEventByAdminHandler);
router.get("/admin/post-events", authenticate, requireRole("admin"), eventsController.getAdminPostEventsHandler);
router.patch("/admin/post-events/:eventId/decision", authenticate, requireRole("admin"), eventsController.decideCompletionReportHandler);
router.patch("/admin/:eventId", authenticate, requireRole("admin"), eventsController.updateApprovedEventByAdminHandler);
router.delete("/admin/:eventId", authenticate, requireRole("admin"), eventsController.deleteApprovedEventByAdminHandler);
router.patch("/:eventId/decision", authenticate, requireRole("admin"), eventsController.decideProposalHandler);

// ── Lead — fixed-path routes (must come BEFORE /:eventId wildcard) ────────────
router.get("/lead/dashboard", authenticate, requireRole("lead"), eventsController.getDashboardHandler);
router.get("/lead",           authenticate, requireRole("lead"), eventsController.getLeadEventsHandler);
router.get("/my-clubs",       authenticate, requireRole("lead", "member"), eventsController.getMyClubEventsHandler);
router.post("/",              authenticate, requireRole("lead"), eventsController.createEventHandler);

// ── Student — fixed-path routes (must come BEFORE /:eventId wildcard) ─────────
router.get("/student", authenticate, requireRole("student"), eventsController.getStudentEventsHandler);
router.get("/student/:eventId", authenticate, requireRole("student"), eventsController.getStudentEventHandler);

// ── Lead — param routes ───────────────────────────────────────────────────────
router.patch("/:eventId/volunteering", authenticate, requireRole("lead"), eventsController.toggleVolunteeringHandler);
router.patch("/:eventId/volunteers/:applicationId/decision", authenticate, requireRole("lead"), eventsController.decideVolunteerApplicationHandler);
router.get("/:eventId", authenticate, requireRole("lead", "admin"), eventsController.getEventHandler);
router.patch("/:eventId", authenticate, requireRole("lead"), eventsController.updateEventHandler);
router.delete("/:eventId", authenticate, requireRole("lead"), eventsController.deleteEventHandler);
router.post("/:eventId/proposal-pdf", authenticate, requireRole("lead"), uploadProposalPdf, eventsController.uploadProposalPdfHandler);
router.post("/:eventId/submit", authenticate, requireRole("lead"), eventsController.submitProposalHandler);
router.patch("/:eventId/complete", authenticate, requireRole("lead"), eventsController.markEventCompletedHandler);

router.post(
  "/:eventId/completion-report-pdf",
  authenticate,
  requireRole("lead"),
  uploadProposalPdf,
  eventsController.uploadCompletionReportPdfHandler
);
export default router;
