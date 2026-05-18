import appDataSource from "../../config/dbConfig.mjs";
import { EventEntity } from "./events.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors.mjs";

const eventRepo    = () => appDataSource.getRepository(EventEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);
const clubRepo     = () => appDataSource.getRepository(ClubEntity);
const userRepo     = () => appDataSource.getRepository(UserEntity);

// Helpers

/**
 * Resolve the display status for a proposal.
 * Draft/pending/rejected stay as-is (mapped from proposal.status).
 * Approved proposals read the live event status (approved/ongoing/completed/report_due).
 */
async function resolveStatus(proposal) {
    if (proposal.status === "approved") {
        const event = await eventRepo().findOne({ where: { proposalId: proposal.id } });
        if (event) return event.status;
    }
    // "pending" in DB → "submitted" for the frontend status map
    if (proposal.status === "pending") return "submitted";
    return proposal.status; // draft | rejected
}

async function enrichProposal(proposal) {
    const status = await resolveStatus(proposal);

    const club = proposal.clubId
        ? await clubRepo().findOne({ where: { id: proposal.clubId } })
        : null;

    // If the proposal has a live event, use the event id so links are correct
    const event = proposal.status === "approved"
        ? await eventRepo().findOne({ where: { proposalId: proposal.id } })
        : null;

    return {
        id:          String(event?.id ?? proposal.id),
        name:        proposal.eventName,
        clubName:    club?.name ?? "Unknown Club",
        clubType:    club?.type ?? "club",
        eventDate:   proposal.proposedDate ?? null,
        attendees:   0,
        status,
    };
}

// Lead — Dashboard summary 

export const getLeadDashboard = async (leadId) => {
    const proposals = await proposalRepo().find({
        where: { leadId },
        order: { createdAt: "DESC" },
    });

    const enriched = await Promise.all(proposals.map(enrichProposal));

    const reportDue = enriched.filter(e => e.status === "report_due");
    const alert = reportDue.length > 0
        ? `Action Required: Event Report for "${reportDue[0].name}" is overdue!`
        : null;

    const lead     = await userRepo().findOne({ where: { id: leadId } });
    const leadClub = await clubRepo().findOne({ where: { leadId } });

    return {
        leadName:  lead?.fullName ?? "Lead",
        clubLabel: leadClub
            ? `${leadClub.name} ${leadClub.type === "community" ? "Community" : "Club"} Lead`
            : "Club Lead",
        alert,
        events:      enriched.slice(0, 3),
        totalEvents: enriched.length,
    };
};

// ── Lead — Full event list 

export const getLeadEvents = async (leadId, statusFilter) => {
    const proposals = await proposalRepo().find({
        where: { leadId },
        order: { createdAt: "DESC" },
    });

    const enriched = await Promise.all(proposals.map(enrichProposal));

    if (!statusFilter || statusFilter === "all") return enriched;
    return enriched.filter(e => e.status === statusFilter);
};

// ── Create proposal (draft or immediately submitted) 

export const createEvent = async (leadId, body) => {
    const { name, eventDate, venueId, description, estimatedBudget, status = "draft" } = body;

    if (!name) throw new ValidationError("Event name is required");

    const lead     = await userRepo().findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundError("Lead not found");

    const leadClub = await clubRepo().findOne({ where: { leadId } });
    if (!leadClub) throw new ForbiddenError("Lead is not associated with any club");

    const proposal = proposalRepo().create({
        leadId,
        clubId:          leadClub.id,
        venueId:         venueId ?? null,
        eventName:       name,
        proposedDate:    eventDate ?? null,
        description:     description ?? null,
        estimatedBudget: estimatedBudget ?? null,
        status:          status === "submitted" ? "pending" : "draft",
        submittedAt:     status === "submitted" ? new Date() : null,
    });

    const saved = await proposalRepo().save(proposal);
    return enrichProposal(saved);
};

// ── Get single event/proposal 

export const getEventById = async (eventId, leadId) => {
    const id = Number(eventId);

    // Try live event first (approved proposals have an event record)
    const event = await eventRepo().findOne({ where: { id } });
    if (event) {
        const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
        if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
        return enrichProposal(proposal);
    }

    // Fall back to proposal id (draft / pending / rejected)
    const proposal = await proposalRepo().findOne({ where: { id } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    return enrichProposal(proposal);
};

// ── Update proposal 
export const updateEvent = async (eventId, leadId, body) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    if (["approved", "rejected"].includes(proposal.status)) {
        throw new ForbiddenError("Cannot edit a locked proposal");
    }

    const { name, eventDate, venueId, description, estimatedBudget } = body;
    await proposalRepo().update(Number(eventId), {
        ...(name !== undefined             && { eventName: name }),
        ...(eventDate !== undefined        && { proposedDate: eventDate }),
        ...(venueId !== undefined          && { venueId }),
        ...(description !== undefined      && { description }),
        ...(estimatedBudget !== undefined  && { estimatedBudget }),
    });

    const updated = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    return enrichProposal(updated);
};

// ── Submit proposal (draft → pending) 

export const submitEventProposal = async (eventId, leadId) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Proposal not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this proposal");
    if (proposal.status !== "draft") throw new ValidationError("Only draft proposals can be submitted");

    await proposalRepo().update(Number(eventId), {
        status:      "pending",
        submittedAt: new Date(),
    });

    const updated = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    return enrichProposal(updated);
};

// ── Admin — Approve or reject a proposal 

export const decideProposal = async (eventId, decision, adminComment) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Proposal not found");
    if (proposal.status !== "pending") throw new ValidationError("Only pending proposals can be reviewed");
    if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'approved' or 'rejected'");
    if (decision === "rejected" && !adminComment) throw new ValidationError("Admin comment is required when rejecting");

    await proposalRepo().update(Number(eventId), {
        status:       decision,
        adminComment: adminComment ?? null,
        reviewedAt:   new Date(),
    });

    if (decision === "approved") {
        if (!proposal.venueId)      throw new ValidationError("Proposal must have a venue before it can be approved");
        if (!proposal.proposedDate) throw new ValidationError("Proposal must have a date before it can be approved");
        if (!proposal.description)  throw new ValidationError("Proposal must have a description before it can be approved");

        const existing = await eventRepo().findOne({ where: { proposalId: proposal.id } });
        if (!existing) {
            await eventRepo().save(eventRepo().create({
                proposalId:  proposal.id,
                clubId:      proposal.clubId,
                venueId:     proposal.venueId,
                name:        proposal.eventName,
                description: proposal.description,
                eventDate:   proposal.proposedDate,
                status:      "approved",
            }));
        }
    }

    const updated = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    return enrichProposal(updated);
};

// ── Admin — All events overview 

export const getAllEvents = async (statusFilter) => {
    const proposals = await proposalRepo().find({ order: { createdAt: "DESC" } });
    const enriched  = await Promise.all(proposals.map(enrichProposal));

    if (!statusFilter || statusFilter === "all") return enriched;
    return enriched.filter(e => e.status === statusFilter);
};
