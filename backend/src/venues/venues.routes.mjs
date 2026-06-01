import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import * as venuesController from "./venues.controller.mjs";

const router = Router();

// GET /api/venues — list all venues (any authenticated user)
router.get("/", authenticate, venuesController.getAllVenuesHandler);

// GET /api/venues/:id/booked-dates — events already booked at this venue
router.get("/:id/booked-dates", authenticate, venuesController.getVenueBookedDatesHandler);

// POST /api/venues — admin: create venue
router.post("/", authenticate, requireRole("admin"), venuesController.createVenueHandler);

// PATCH /api/venues/:id — admin: update venue
router.patch("/:id", authenticate, requireRole("admin"), venuesController.updateVenueHandler);

// DELETE /api/venues/:id — admin: delete venue
router.delete("/:id", authenticate, requireRole("admin"), venuesController.deleteVenueHandler);

export default router;
