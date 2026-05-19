import { In } from "typeorm";
import appDataSource from "../../config/dbConfig.mjs";
import { EventEntity } from "./events.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { VenueEntity } from "../venues/venues.entity.mjs";
import { VolunteeringRoleEntity } from "../volunteering/volunteering_roles.entity.mjs";
import { VolunteeringApplicationEntity } from "../volunteering/volunteering_applications.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors.mjs";

const eventRepo    = () => appDataSource.getRepository(EventEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);
const clubRepo     = () => appDataSource.getRepository(ClubEntity);
const userRepo     = () => appDataSource.getRepository(UserEntity);
const venueRepo    = () => appDataSource.getRepository(VenueEntity);
const roleRepo     = () => appDataSource.getRepository(VolunteeringRoleEntity);
const appRepo      = () => appDataSource.getRepository(VolunteeringApplicationEntity);

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
        clubType:    leadClub?.type ?? "club",
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

// ── Lead — Delete draft proposal ─────────────────────────────────────────────

export const deleteEvent = async (eventId, leadId) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    if (proposal.status !== "draft") throw new ForbiddenError("Only draft proposals can be deleted");

    await proposalRepo().delete(Number(eventId));
};

// ── Admin — Approve or reject a proposal ─────────────────────────────────────

export const decideProposal = async (eventId, decision, adminComment) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Proposal not found");
    if (proposal.status !== "pending") throw new ValidationError("Only pending proposals can be reviewed");
    if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'approved' or 'rejected'");
    if (decision === "rejected" && !adminComment) throw new ValidationError("Admin comment is required when rejecting");

    // Validate before writing — prevents approved status with no event record
    if (decision === "approved") {
        if (!proposal.venueId)      throw new ValidationError("Proposal must have a venue before it can be approved");
        if (!proposal.proposedDate) throw new ValidationError("Proposal must have a date before it can be approved");
        if (!proposal.description)  throw new ValidationError("Proposal must have a description before it can be approved");
    }

    await proposalRepo().update(Number(eventId), {
        status:       decision,
        adminComment: adminComment ?? null,
        reviewedAt:   new Date(),
    });

    if (decision === "approved") {
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

// ── Lead — Upload proposal PDF ────────────────────────────────────────────────

export const uploadProposalPdf = async (eventId, leadId, fileUrl) => {
    const proposal = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    if (!proposal) throw new NotFoundError("Proposal not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this proposal");
    if (["approved", "rejected"].includes(proposal.status)) {
        throw new ForbiddenError("Cannot modify a locked proposal");
    }

    await proposalRepo().update(Number(eventId), { proposalPdfUrl: fileUrl });
    const updated = await proposalRepo().findOne({ where: { id: Number(eventId) } });
    return enrichProposal(updated);
};

// ── Lead — Full event detail (with venue, budget, volunteering) ───────────────

export const getEventDetail = async (eventId, leadId) => {
    const id = Number(eventId);
    let proposal = null;
    let liveEvent = null;

    const event = await eventRepo().findOne({ where: { id } });
    if (event) {
        proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
        if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
        liveEvent = event;
    } else {
        proposal = await proposalRepo().findOne({ where: { id } });
        if (!proposal) throw new NotFoundError("Event not found");
        if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    }

    const status = await resolveStatus(proposal);
    const club   = proposal.clubId
        ? await clubRepo().findOne({ where: { id: proposal.clubId } })
        : null;
    const venue  = proposal.venueId
        ? await venueRepo().findOne({ where: { id: proposal.venueId } })
        : null;

    let volunteeringStatus = null;
    let volunteers = [];

    if (liveEvent) {
        volunteeringStatus = liveEvent.volunteeringStatus;
        const roles = await roleRepo().find({ where: { eventId: liveEvent.id } });

        if (roles.length > 0) {
            const roleIds = roles.map(r => r.id);
            const applications = await appRepo().find({ where: { roleId: In(roleIds) } });

            if (applications.length > 0) {
                const studentIds = [...new Set(applications.map(a => a.studentId))];
                const students   = await userRepo().findBy({ id: In(studentIds) });
                const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
                const roleMap    = Object.fromEntries(roles.map(r => [r.id, r]));

                volunteers = applications.map(app => ({
                    applicationId:   app.id,
                    studentName:     studentMap[app.studentId]?.fullName ?? "Unknown",
                    studentMatricId: studentMap[app.studentId]?.staffOrMatricId ?? null,
                    appliedAt:       app.appliedAt,
                    status:          app.status,
                    roleName:        roleMap[app.roleId]?.roleName ?? "Volunteer",
                }));
            }
        }
    }

    return {
        id:                  String(liveEvent?.id ?? proposal.id),
        name:                proposal.eventName,
        clubName:            club?.name ?? "Unknown Club",
        clubType:            club?.type ?? "club",
        eventDate:           proposal.proposedDate ?? null,
        status,
        venueName:           venue?.name ?? null,
        budget:              proposal.estimatedBudget ? Number(proposal.estimatedBudget) : null,
        proposalPdfUrl:      proposal.proposalPdfUrl ?? null,
        adminComment:        proposal.adminComment ?? null,
        volunteeringStatus,
        volunteers,
    };
};

// ── Lead — Toggle volunteering open / closed ─────────────────────────────────

export const toggleVolunteering = async (eventId, leadId, newStatus) => {
    const id = Number(eventId);
    const event = await eventRepo().findOne({ where: { id } });
    if (!event) throw new NotFoundError("Event not found");

    const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
    if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    if (!["open", "closed"].includes(newStatus)) throw new ValidationError("Status must be 'open' or 'closed'");
    if (event.volunteeringStatus === "full") throw new ValidationError("Cannot change status when all slots are full");

    await eventRepo().update(id, { volunteeringStatus: newStatus });
    return { volunteeringStatus: newStatus };
};

// ── Lead — Decide on a volunteer application ──────────────────────────────────

export const decideVolunteerApplication = async (eventId, applicationId, leadId, decision) => {
    const id  = Number(eventId);
    const aid = Number(applicationId);

    const event = await eventRepo().findOne({ where: { id } });
    if (!event) throw new NotFoundError("Event not found");

    const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
    if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    const application = await appRepo().findOne({ where: { id: aid } });
    if (!application) throw new NotFoundError("Application not found");

    const role = await roleRepo().findOne({ where: { id: application.roleId } });
    if (!role || role.eventId !== event.id) throw new ForbiddenError("Application does not belong to this event");

    if (!["accepted", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'accepted' or 'rejected'");
    if (application.status !== "pending") throw new ValidationError("Only pending applications can be reviewed");

    await appRepo().update(aid, { status: decision, reviewedAt: new Date() });

    if (decision === "accepted") {
        await roleRepo().update(application.roleId, { slotsFilled: () => "slots_filled + 1" });
        const updatedRole = await roleRepo().findOne({ where: { id: application.roleId } });
        if (updatedRole && updatedRole.slotsFilled >= updatedRole.slotsAvailable) {
            const allRoles = await roleRepo().find({ where: { eventId: event.id } });
            const allFull  = allRoles.every(r => r.slotsFilled >= r.slotsAvailable);
            if (allFull) await eventRepo().update(id, { volunteeringStatus: "full" });
        }
    }

    return { applicationId: aid, status: decision };
};

// ── Admin — All events overview

export const getAllEvents = async (statusFilter) => {
    const proposals = await proposalRepo().find({ order: { createdAt: "DESC" } });
    const enriched  = await Promise.all(proposals.map(enrichProposal));

    if (!statusFilter || statusFilter === "all") return enriched;
    return enriched.filter(e => e.status === statusFilter);
};
