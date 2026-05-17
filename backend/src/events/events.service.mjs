import appDataSource from "../../config/dbConfig.mjs";
import { EventEntity } from "./events.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors.mjs";

const eventRepo = () => appDataSource.getRepository(EventEntity);
const clubRepo  = () => appDataSource.getRepository(ClubEntity);
const userRepo  = () => appDataSource.getRepository(UserEntity);

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Enrich a raw event row with club name */
async function enrichEvent(event) {
    const club = event.clubId
        ? await clubRepo().findOne({ where: { id: event.clubId } })
        : null;
    return {
        ...event,
        clubName: club?.name ?? "Unknown Club",
        clubType: club?.type ?? "club",
    };
}

// ── Lead — Dashboard summary ───────────────────────────────────────────────────

/**
 * Returns events owned by the logged-in lead, plus an alert message
 * if any event has a report due (status = report_due).
 */
export const getLeadDashboard = async (leadId) => {
    const events = await eventRepo().find({
        where: { leadId },
        order: { createdAt: "DESC" },
    });

    const enriched = await Promise.all(events.map(enrichEvent));

    // Find overdue/report-due events for alert banner
    const reportDueEvents = enriched.filter(e => e.status === "report_due");
    const alert = reportDueEvents.length > 0
        ? `Action Required: Event Report for "${reportDueEvents[0].name}" is overdue!`
        : null;

    // Fetch the lead's club name for the welcome banner
    const lead = await userRepo().findOne({ where: { id: leadId } });
    const club = lead?.clubId
        ? await clubRepo().findOne({ where: { id: lead.clubId } })
        : null;

    return {
        leadName: lead?.name ?? "Lead",
        clubLabel: club
            ? `${club.name} ${club.type === "community" ? "Community" : "Club"} Lead`
            : "Club Lead",
        alert,
        events: enriched.slice(0, 3),         // show latest 3 on dashboard
        totalEvents: enriched.length,
    };
};

// ── Lead — Full event list ─────────────────────────────────────────────────────

export const getLeadEvents = async (leadId, statusFilter) => {
    const where = { leadId };
    if (statusFilter && statusFilter !== "all") {
        where.status = statusFilter;
    }

    const events = await eventRepo().find({ where, order: { createdAt: "DESC" } });
    return Promise.all(events.map(enrichEvent));
};

// ── Create event (draft or submitted) ─────────────────────────────────────────

export const createEvent = async (leadId, body) => {
    const { name, eventDate, venue, description, estimatedBudget, status = "draft" } = body;

    if (!name) throw new ValidationError("Event name is required");

    // Verify lead exists and has a club
    const lead = await userRepo().findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundError("Lead not found");
    if (!lead.clubId) throw new ForbiddenError("Lead is not associated with any club");

    const event = eventRepo().create({
        name,
        clubId: lead.clubId,
        leadId,
        eventDate: eventDate || null,
        venue: venue || null,
        description: description || null,
        estimatedBudget: estimatedBudget || null,
        status,
    });

    const saved = await eventRepo().save(event);
    return enrichEvent(saved);
};

// ── Get single event (lead must own it) ───────────────────────────────────────

export const getEventById = async (eventId, leadId) => {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    if (event.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    return enrichEvent(event);
};

// ── Update event ──────────────────────────────────────────────────────────────

export const updateEvent = async (eventId, leadId, body) => {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    if (event.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    // Cannot edit an approved/completed event's core details
    const lockedStatuses = ["approved", "completed", "report_due"];
    if (lockedStatuses.includes(event.status) && body.name) {
        throw new ForbiddenError("Cannot edit a locked event. Contact admin.");
    }

    const { name, eventDate, venue, description, estimatedBudget } = body;
    await eventRepo().update(eventId, {
        ...(name && { name }),
        ...(eventDate !== undefined && { eventDate }),
        ...(venue !== undefined && { venue }),
        ...(description !== undefined && { description }),
        ...(estimatedBudget !== undefined && { estimatedBudget }),
    });

    const updated = await eventRepo().findOne({ where: { id: eventId } });
    return enrichEvent(updated);
};

// ── Submit event proposal (draft → submitted) ─────────────────────────────────

export const submitEventProposal = async (eventId, leadId) => {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    if (event.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    if (event.status !== "draft") throw new ValidationError("Only draft events can be submitted");

    await eventRepo().update(eventId, { status: "submitted" });
    const updated = await eventRepo().findOne({ where: { id: eventId } });
    return enrichEvent(updated);
};

// ── Admin — Approve or reject proposal ────────────────────────────────────────

export const decideProposal = async (eventId, decision, adminComment) => {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    if (!["submitted"].includes(event.status)) {
        throw new ValidationError("Only submitted events can be reviewed");
    }
    if (!["approved", "rejected"].includes(decision)) {
        throw new ValidationError("Decision must be 'approved' or 'rejected'");
    }
    if (decision === "rejected" && !adminComment) {
        throw new ValidationError("Admin comment is required when rejecting");
    }

    await eventRepo().update(eventId, { status: decision, adminComment: adminComment || null });
    const updated = await eventRepo().findOne({ where: { id: eventId } });
    return enrichEvent(updated);
};

// ── Admin — Get all events ─────────────────────────────────────────────────────

export const getAllEvents = async (statusFilter) => {
    const where = {};
    if (statusFilter && statusFilter !== "all") where.status = statusFilter;
    const events = await eventRepo().find({ where, order: { createdAt: "DESC" } });
    return Promise.all(events.map(enrichEvent));
};
