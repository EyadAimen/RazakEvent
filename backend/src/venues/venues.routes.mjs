import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.mjs";
import * as venuesController from "./venues.controller.mjs";

const router = Router();

// GET /api/venues — list all venues (any authenticated user)
router.get("/", authenticate, venuesController.getAllVenuesHandler);

export default router;
