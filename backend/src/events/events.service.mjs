import { In } from "typeorm";
import appDataSource from "../../config/dbConfig.mjs";
import { EventEntity } from "./events.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { ClubMemberEntity } from "../clubs/club_members.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { VenueEntity } from "../venues/venues.entity.mjs";
import { VolunteeringRoleEntity } from "../volunteering/volunteering_roles.entity.mjs";
import { VolunteeringApplicationEntity } from "../volunteering/volunteering_applications.entity.mjs";
import { CertificateEntity } from "../certificates/certificates.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors.mjs";

const eventRepo = () => appDataSource.getRepository(EventEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);
const clubRepo = () => appDataSource.getRepository(ClubEntity);
const clubMemberRepo = () => appDataSource.getRepository(ClubMemberEntity);
const userRepo = () => appDataSource.getRepository(UserEntity);
const venueRepo = () => appDataSource.getRepository(VenueEntity);
const roleRepo = () => appDataSource.getRepository(VolunteeringRoleEntity);
const appRepo = () => appDataSource.getRepository(VolunteeringApplicationEntity);

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
        id: String(proposal.id),
        name: proposal.eventName,
        clubName: club?.name ?? "Unknown Club",
        clubType: club?.type ?? "club",
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
    let alert = null;
    if (reportDue.length > 0) {
        const first = reportDue[0];
        const event = await eventRepo().findOne({ where: { proposalId: Number(first.id) } });
        const overdue = event?.reportDueAt && new Date(event.reportDueAt) < new Date();
        alert = overdue
            ? `Action Required: Event Report for "${first.name}" is overdue!`
            : `Reminder: Event Report for "${first.name}" is due soon.`;
    }

    const lead = await userRepo().findOne({ where: { id: leadId } });
    const leadClub = await clubRepo().findOne({ where: { leadId } });

    return {
        leadName: lead?.fullName ?? "Lead",
        clubLabel: leadClub
            ? `${leadClub.name} ${leadClub.type === "community" ? "Community" : "Club"} Lead`
            : "Club Lead",
        clubType: leadClub?.type ?? "club",
        alert,
        reportDueEventId: reportDue.length > 0 ? reportDue[0].id : null,
        events: enriched.slice(0, 3),
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

    const lead = await userRepo().findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundError("Lead not found");

    const leadClub = await clubRepo().findOne({ where: { leadId } });
    if (!leadClub) throw new ForbiddenError("Lead is not associated with any club");

    const proposal = proposalRepo().create({
        leadId,
        clubId: leadClub.id,
        venueId: venueId ?? null,
        eventName: name,
        proposedDate: eventDate ?? null,
        description: description ?? null,
        estimatedBudget: estimatedBudget ?? null,
        status: status === "submitted" ? "pending" : "draft",
        submittedAt: status === "submitted" ? new Date() : null,
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
        ...(name !== undefined && { eventName: name }),
        ...(eventDate !== undefined && { proposedDate: eventDate }),
        ...(venueId !== undefined && { venueId }),
        ...(description !== undefined && { description }),
        ...(estimatedBudget !== undefined && { estimatedBudget }),
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
        status: "pending",
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
        if (!proposal.venueId) throw new ValidationError("Proposal must have a venue before it can be approved");
        if (!proposal.proposedDate) throw new ValidationError("Proposal must have a date before it can be approved");
        if (!proposal.description) throw new ValidationError("Proposal must have a description before it can be approved");
    }

    await proposalRepo().update(Number(eventId), {
        status: decision,
        adminComment: adminComment ?? null,
        reviewedAt: new Date(),
    });

    if (decision === "approved") {
        const existing = await eventRepo().findOne({ where: { proposalId: proposal.id } });
        if (!existing) {
            await eventRepo().save(eventRepo().create({
                proposalId: proposal.id,
                clubId: proposal.clubId,
                venueId: proposal.venueId,
                name: proposal.eventName,
                description: proposal.description,
                eventDate: proposal.proposedDate,
                status: "approved",
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
    const liveEvent = await eventRepo().findOne({
        where: { id: Number(eventId) },
    });

    if (!liveEvent) {
        throw new NotFoundError("Event not found");
    }

    const club = await clubRepo().findOne({
        where: { id: liveEvent.clubId },
    });

    const venue = await venueRepo().findOne({
        where: { id: liveEvent.venueId },
    });

    const roles = await roleRepo().find({
        where: { eventId: liveEvent.id },
        order: { roleName: "ASC" },
    });

    const volunteerRoles = roles.map((role) => ({
        id: role.id,
        name: role.roleName,
        description: role.description ?? null,
        slotsAvailable: role.slotsAvailable,
        slotsFilled: role.slotsFilled,
        remainingSlots: role.slotsAvailable - role.slotsFilled,
    }));

    let hasApplied = false;

    if (userId) {
        const application = await appRepo().findOne({
            where: {
                eventId: liveEvent.id,
                studentId: userId,
                status: In(["pending", "accepted"]),
            },
        });

        hasApplied = !!application;
    }

    // Leads organise the event — they may not apply as volunteers
    const isLead = club?.leadId === userId;

    // All authenticated non-lead students may volunteer
    const canVolunteer =
        !!userId &&
        !isLead &&
        liveEvent.volunteeringStatus === "open" &&
        !hasApplied;

    return {
        id: liveEvent.id,
        name: liveEvent.name,
        description: liveEvent.description,
        clubName: club?.name ?? "Unknown Club",
        clubType: club?.type ?? "club",
        eventDate: liveEvent.eventDate,
        status: liveEvent.status,
        venueName: venue?.name ?? null,
        volunteeringStatus: liveEvent.volunteeringStatus,
        volunteerRoles,
        hasApplied,
        canVolunteer,
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

    await eventRepo().update(event.id, { volunteeringStatus: newStatus });
    return { volunteeringStatus: newStatus };
};

// ── Lead — Accept / reject a volunteer application ────────────────────────────

export const decideVolunteerApplication = async (eventId, applicationId, leadId, decision) => {
    if (!["accepted", "rejected"].includes(decision))
        throw new ValidationError("Decision must be 'accepted' or 'rejected'");

    const proposalId = Number(eventId);
    const proposal = await proposalRepo().findOne({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    const event = await eventRepo().findOne({ where: { proposalId } });
    if (!event) throw new NotFoundError("Approved event record not found");

    const application = await appRepo().findOne({
        where: { id: Number(applicationId), eventId: event.id },
    });
    if (!application) throw new NotFoundError("Volunteer application not found");
    if (application.status !== "pending")
        throw new ValidationError("Application has already been decided");

    await appRepo().update(application.id, { status: decision, reviewedAt: new Date() });

    if (decision === "accepted") {
        await roleRepo().increment({ id: application.roleId }, "slotsFilled", 1);
        const updatedRole = await roleRepo().findOne({ where: { id: application.roleId } });
        if (updatedRole && updatedRole.slotsFilled >= updatedRole.slotsAvailable) {
            // Only mark the event full when every role is at capacity
            const allRoles = await roleRepo().find({ where: { eventId: event.id } });
            const allFull = allRoles.every(r => r.slotsFilled >= r.slotsAvailable);
            if (allFull) await eventRepo().update(event.id, { volunteeringStatus: "full" });
        }
    }

    return { applicationId: application.id, status: decision };
};

// ── Admin — All events overview

export const getAllEvents = async (statusFilter) => {
    const proposals = await proposalRepo().find({ order: { createdAt: "DESC" } });
    const enriched = await Promise.all(proposals.map(enrichProposal));

    if (!statusFilter || statusFilter === "all") return enriched;
    return enriched.filter(e => e.status === statusFilter);
};

// ── Lead — Mark event as completed ───────────────────────────────────────────

export const markEventCompleted = async (eventId, leadId, applicationIds = []) => {
    const parsedId = parseInt(eventId);
    const event = await eventRepo().findOne({ where: { id: parsedId } })
        ?? await eventRepo().findOne({ where: { proposalId: parsedId } });
    if (!event) throw new NotFoundError("Event not found");

    const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
    if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    if (!["approved", "ongoing"].includes(event.status)) {
        throw new ValidationError("Only approved or ongoing events can be marked as completed");
    }

    if (new Date(event.eventDate) > new Date()) {
        throw new ValidationError("Event cannot be marked as completed before its date has passed");
    }

    // Completing an event opens the 14-day post-event reporting window.
    // Status moves to "report_due"; submitReports flips it to "completed" once reports are in.
    const completedAt = new Date();
    const reportDueAt = new Date(completedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    await eventRepo().update(event.id, {
        status: "report_due",
        volunteeringStatus: "closed",
        completedAt,
        reportDueAt,
    });

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return { message: "Event marked as completed", certificates: { issued: [], skipped: [] } };
    }

    // Issue certificates for the provided accepted volunteer applications
    const applications = await appRepo().findBy({ id: In(applicationIds.map(Number)) });
    const validApps = applications.filter(a => a.eventId === event.id && a.status === "accepted");

    const certRepo = () => appDataSource.getRepository(CertificateEntity);
    const issued = [];
    const skipped = [];

    for (const app of validApps) {
        try {
            await (certRepo()).insert({ userId: app.studentId, eventId: event.id, type: "volunteer" });
            issued.push(app.studentId);
        } catch (err) {
            if (err.code === "23505") skipped.push(app.studentId);
            else throw err;
        }
    }

    return { message: "Event marked as completed", certificates: { issued, skipped } };
};

// ── Student — All approved events (no ownership check) ──────────────────────
export const getStudentEvents = async () => {
    const events = await eventRepo().find({
        where: { status: "approved" },
        order: { eventDate: "ASC" },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events.filter(
        event => new Date(event.eventDate) >= today
    );
    const enriched = await Promise.all(upcomingEvents.map(async (event) => {
        const club = await clubRepo().findOne({
            where: { id: event.clubId }
        });
        return {
            id: event.id,
            name: event.name,
            description: event.description,
            eventDate: event.eventDate,
            status: event.status,
            clubName: club?.name ?? "Unknown Club",
        };
    }));
    return enriched;
};

// ── My clubs events (lead + member) ──────────────────────────────────────────

export const getMyClubEvents = async (userId) => {
    // Events from clubs the user leads (proposals, all statuses)
    const leadProposals = await proposalRepo().find({
        where: { leadId: userId },
        order: { createdAt: "DESC" },
    });
    const leadEvents = await Promise.all(
        leadProposals.map(p => enrichProposal(p).then(e => ({ ...e, userRole: "lead" })))
    );

    // Events from clubs where user is a member (approved/live events only)
    const memberRows = await clubMemberRepo().find({ where: { userId } });
    const memberClubIds = memberRows.map(r => r.clubId);

    let memberEvents = [];
    if (memberClubIds.length) {
        const events = await eventRepo().find({
            where: { clubId: In(memberClubIds) },
            order: { eventDate: "DESC" },
        });
        const clubIds = [...new Set(events.map(e => e.clubId))];
        const clubs = clubIds.length ? await clubRepo().findBy({ id: In(clubIds) }) : [];
        const clubMap = Object.fromEntries(clubs.map(c => [c.id, c]));

        memberEvents = events.map(e => ({
            id: String(e.id),
            name: e.name,
            clubName: clubMap[e.clubId]?.name ?? "Unknown Club",
            clubType: clubMap[e.clubId]?.type ?? "club",
            eventDate: e.eventDate ?? null,
            attendees: 0,
            status: e.status,
            userRole: "member",
        }));
    }

    return [...leadEvents, ...memberEvents];
};
