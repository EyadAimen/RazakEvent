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

    // Always use proposal.id — event.id lives in a separate table and can collide numerically
    return {
        id:        String(proposal.id),
        name:      proposal.eventName,
        clubName:  club?.name ?? "Unknown Club",
        clubType:  club?.type ?? "club",
        eventDate: proposal.proposedDate ?? null,
        attendees: 0,
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
        clubType:           leadClub?.type ?? "club",
        alert,
        reportDueEventId:   reportDue.length > 0 ? reportDue[0].id : null,
        events:             enriched.slice(0, 3),
        totalEvents:        enriched.length,
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

// ... (all your imports and other functions remain exactly as they were, except the two below)

export const getEventDetail = async (eventId, userId, userRole) => {
    const id = Number(eventId);
    if (isNaN(id)) throw new NotFoundError("Event not found");

    // Try proposal table first; if not found, fall back via EventEntity (approved events)
    let proposal = await proposalRepo().findOne({ where: { id } });
    if (!proposal) {
        const liveEventById = await eventRepo().findOne({ where: { id } });
        if (liveEventById) {
            proposal = await proposalRepo().findOne({ where: { id: liveEventById.proposalId } });
        }
    }
    if (!proposal) throw new NotFoundError("Event not found");

  // Allow admin to bypass ownership
  if (userRole !== "admin" && proposal.leadId !== userId) {
    throw new ForbiddenError("You do not own this event");
  }

  const liveEvent = proposal.status === "approved"
    ? await eventRepo().findOne({ where: { proposalId: proposal.id } })
    : null;

  const status = await resolveStatus(proposal);
  const club = proposal.clubId
    ? await clubRepo().findOne({ where: { id: proposal.clubId } })
    : null;
  const venue = proposal.venueId
    ? await venueRepo().findOne({ where: { id: proposal.venueId } })
    : null;

  let volunteeringStatus = null;
  let volunteers = [];
  let volunteerRoles = [];

  if (liveEvent) {
    volunteeringStatus = liveEvent.volunteeringStatus;
    const roles = await roleRepo().find({ where: { eventId: liveEvent.id } });
    if (roles.length > 0) {
      volunteerRoles = roles.map(role => ({
        roleId: role.id,
        roleName: role.roleName,
        description: role.description,
        slotsAvailable: role.slotsAvailable,
        slotsFilled: role.slotsFilled,
      }));
      const roleIds = roles.map(r => r.id);
      const applications = await appRepo().find({ where: { roleId: In(roleIds) } });
      if (applications.length > 0) {
        const studentIds = [...new Set(applications.map(a => a.studentId))];
        const students = await userRepo().findBy({ id: In(studentIds) });
        const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
        const roleMap = Object.fromEntries(roles.map(r => [r.id, r]));
        volunteers = applications.map(app => ({
          applicationId: app.id,
          studentName: studentMap[app.studentId]?.fullName ?? "Unknown",
          studentMatricId: studentMap[app.studentId]?.staffOrMatricId ?? null,
          appliedAt: app.appliedAt,
          status: app.status,
          roleName: roleMap[app.roleId]?.roleName ?? "Volunteer",
          reason: app.reason,
          rejectionMessage: app.rejectionMessage,
        }));
      }
    }
  }

  return {
    id: String(proposal.id),
    name: proposal.eventName,
    clubName: club?.name ?? "Unknown Club",
    clubType: club?.type ?? "club",
    eventDate: proposal.proposedDate ?? null,
    status,
    venueName: venue?.name ?? null,
    budget: proposal.estimatedBudget ? Number(proposal.estimatedBudget) : null,
    proposalPdfUrl: proposal.proposalPdfUrl ?? null,
    adminComment: proposal.adminComment ?? null,
    volunteeringStatus,
    volunteerRoles,
    volunteers,
  };
};

// Add this new function for student detail (no ownership check)
export const getStudentEventDetail = async (eventId, userId) => {
  const id = Number(eventId);
  // First, find the proposal using the id passed from the frontend
  const proposal = await proposalRepo().findOne({ where: { id } });
  if (!proposal) throw new NotFoundError("Event not found");

  // Only approved proposals are visible to students, and they have an entry in the Event table
  if (proposal.status !== "approved") throw new NotFoundError("Event not found or not approved");
  const liveEvent = await eventRepo().findOne({ where: { proposalId: proposal.id } });
  if (!liveEvent) throw new NotFoundError("Approved event record not found");

  const club = proposal.clubId
    ? await clubRepo().findOne({ where: { id: proposal.clubId } })
    : null;
  const venue = proposal.venueId
    ? await venueRepo().findOne({ where: { id: proposal.venueId } })
    : null;

  let volunteeringStatus = liveEvent.volunteeringStatus ?? null;
  let volunteerRoles = [];

  const roles = await roleRepo().find({
    where: { eventId: liveEvent.id },
    order: { roleName: "ASC" },
  });
  volunteerRoles = roles.map(role => ({
    id: role.id,
    name: role.roleName,
    slotsAvailable: role.slotsAvailable,
    slotsFilled: role.slotsFilled,
    remainingSlots: role.slotsAvailable - role.slotsFilled,
  }));

  let hasApplied = false;
  if (userId) {
    const { VolunteeringApplicationEntity } = await import("../volunteering/volunteering_applications.entity.mjs");
    const { In } = await import("typeorm");
    const application = await appDataSource.getRepository(VolunteeringApplicationEntity).findOne({
      where: {
        eventId: liveEvent.id,
        studentId: userId,
        status: In(["pending", "accepted"])
      }
    });
    hasApplied = !!application;
  }

  return {
    id: Number(proposal.id),
    name: liveEvent.name,
    description: liveEvent.description,
    clubName: club?.name ?? "Unknown Club",
    clubType: club?.type ?? "club",
    eventDate: liveEvent.eventDate,
    status: liveEvent.status,
    venueName: venue?.name ?? null,
    budget: proposal.estimatedBudget ? Number(proposal.estimatedBudget) : null,
    proposalPdfUrl: proposal.proposalPdfUrl ?? null,
    adminComment: proposal.adminComment ?? null,
    volunteeringStatus,
    volunteerRoles,
    hasApplied,
  };
};
// All other existing functions (getLeadDashboard, createEvent, getAllEvents, etc.) remain exactly as you had them.
// ── Lead — Toggle volunteering open / closed ─────────────────────────────────

export const toggleVolunteering = async (eventId, leadId, newStatus) => {
    const proposalId = Number(eventId);

    const proposal = await proposalRepo().findOne({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    const event = await eventRepo().findOne({ where: { proposalId } });
    if (!event) throw new NotFoundError("Approved event record not found");

    if (!["open", "closed"].includes(newStatus)) throw new ValidationError("Status must be 'open' or 'closed'");
    if (event.volunteeringStatus === "full") throw new ValidationError("Cannot change status when all slots are full");

    await eventRepo().update(event.id, { volunteeringStatus: newStatus });
    return { volunteeringStatus: newStatus };
};



// ── Admin — All events overview

export const getAllEvents = async (statusFilter) => {
    const proposals = await proposalRepo().find({ order: { createdAt: "DESC" } });
    const enriched  = await Promise.all(proposals.map(enrichProposal));

    if (!statusFilter || statusFilter === "all") return enriched;
    return enriched.filter(e => e.status === statusFilter);
};

// ── Student — All approved events (no ownership check) ──────────────────────
export const getStudentEvents = async () => {
    const events = await eventRepo().find({
        where: { status: In(["approved", "ongoing", "completed", "report_due"]) },
        order: { eventDate: "ASC" },
    });

    const enriched = await Promise.all(events.map(async (event) => {
        const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
        const club = proposal ? await clubRepo().findOne({ where: { id: proposal.clubId } }) : null;
        return {
            id: String(event.proposalId),
            name: event.name,
            description: event.description,
            eventDate: event.eventDate,
            status: event.status,
            clubName: club?.name ?? "Unknown Club",
        };
    }));
    return enriched;
};