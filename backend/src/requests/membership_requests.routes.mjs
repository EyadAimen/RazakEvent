import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import {
    submitMembershipRequestHandler,
    getMyRequestsHandler,
    getIncomingRequestsHandler,
    decideMembershipHandler,
} from "./membership_requests.controller.mjs";

const router = Router();

router.post("/",           authenticate, requireRole("student", "member", "lead"), submitMembershipRequestHandler);
router.get("/mine",        authenticate, requireRole("student", "member", "lead"), getMyRequestsHandler);
router.get("/incoming",    authenticate, requireRole("lead"),              getIncomingRequestsHandler);
router.patch("/:id/decision", authenticate, requireRole("lead"),          decideMembershipHandler);

export default router;
