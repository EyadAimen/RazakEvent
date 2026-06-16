import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { getVolunteersHandler, issueHandler, mineHandler, downloadHandler } from "./certificates.controller.mjs";

const router = Router();

// Fixed paths before param paths
router.get("/mine",                      authenticate, requireRole("student", "member", "lead"), mineHandler);
router.get("/events/:eventId/volunteers", authenticate, requireRole("lead"),              getVolunteersHandler);
router.post("/events/:eventId/issue",    authenticate, requireRole("lead"),              issueHandler);
router.get("/:id/download",              authenticate,                                   downloadHandler);

export default router;
