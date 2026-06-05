import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { getAdminDashboardHandler } from "./dashboard.controller.mjs";

const router = Router();

router.get("/admin", authenticate, requireRole("admin"), getAdminDashboardHandler);

export default router;
