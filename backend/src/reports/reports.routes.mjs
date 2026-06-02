import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { uploadReportFiles } from "../shared/upload.middleware.mjs";
import { getReportStatusHandler, submitReportsHandler } from "./reports.controller.mjs";

const router = Router();

// GET /api/reports/events/:eventId — current report status for an event
router.get("/events/:eventId", authenticate, requireRole("lead"), getReportStatusHandler);

// POST /api/reports/events/:eventId — submit event + money report PDFs
router.post("/events/:eventId", authenticate, requireRole("lead"), uploadReportFiles, submitReportsHandler);

export default router;
