import { In } from "typeorm";
import appDataSource from "../../config/dbConfig.mjs";
import { VolunteeringRoleEntity } from "./volunteering_roles.entity.mjs";
import { VolunteeringApplicationEntity } from "./volunteering_applications.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { ClubMemberEntity } from "../clubs/club_members.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../shared/errors.mjs";

const roleRepo = () => appDataSource.getRepository(VolunteeringRoleEntity);
const appRepo = () => appDataSource.getRepository(VolunteeringApplicationEntity);
const eventRepo = () => appDataSource.getRepository(EventEntity);
const clubRepo = () => appDataSource.getRepository(ClubEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);
const clubMemberRepo = () => appDataSource.getRepository(ClubMemberEntity);

async function assertLeadOwnsEvent(proposalId, leadId) {
    // The frontend uses proposal.id as the external event identifier
    const proposal = await proposalRepo().findOne({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    const event = await eventRepo().findOne({ where: { proposalId } });
    if (!event) throw new NotFoundError("Approved event record not found");
    return event;
}

// ── Student — Browse open events with roles ───────────────────────────────────

export const getOpenEvents = async () => {
    const events = await eventRepo().find({
        where: { volunteeringStatus: "open" },
        order: { eventDate: "ASC" },
    });

    if (events.length === 0) return { events: [] };

    const eventIds = events.map(e => e.id);
    const roles = await roleRepo().find({ where: { eventId: In(eventIds) } });

    const clubIds = [...new Set(events.map(e => e.clubId))];
    const clubs = await clubRepo().findBy({ id: In(clubIds) });
    const clubMap = Object.fromEntries(clubs.map(c => [c.id, c]));

    const rolesByEvent = {};
    for (const role of roles) {
        if (!rolesByEvent[role.eventId]) rolesByEvent[role.eventId] = [];
        rolesByEvent[role.eventId].push({
            roleId: role.id,
            roleName: role.roleName,
            description: role.description ?? null,
            slotsAvailable: role.slotsAvailable,
            slotsFilled: role.slotsFilled,
        });
    }

    return {
        events: events.map(e => ({
            eventId: e.id,
            eventName: e.name,
            eventDate: e.eventDate,
            clubName: clubMap[e.clubId]?.name ?? "Unknown Club",
            roles: rolesByEvent[e.id] ?? [],
        })),
    };
};

// ── Lead — Create a volunteering role ─────────────────────────────────────────

export const createRole = async (eventId, leadId, body) => {
    const { roleName, description, slotsAvailable } = body;

    if (!roleName) throw new ValidationError("roleName is required");
    if (!slotsAvailable || slotsAvailable < 1) throw new ValidationError("slotsAvailable must be at least 1");

    const event = await assertLeadOwnsEvent(Number(eventId), leadId);

    const role = await roleRepo().save(
        roleRepo().create({
            eventId: event.id,   // use the real events table ID
            roleName,
            description: description ?? null,
            slotsAvailable,
            slotsFilled: 0,
        })
    );

    return {
        roleId: role.id,
        roleName: role.roleName,
        description: role.description,
        slotsAvailable: role.slotsAvailable,
        slotsFilled: 0,
    };
};

// ── Lead — Update a volunteering role ─────────────────────────────────────────

export const updateRole = async (roleId, leadId, body) => {
    const { roleName, description, slotsAvailable } = body;

    const role = await roleRepo().findOne({ where: { id: Number(roleId) } });
    if (!role) throw new NotFoundError("Role not found");

    const event = await eventRepo().findOne({ where: { id: role.eventId } });
    if (!event) throw new NotFoundError("Event not found");
    await assertLeadOwnsEvent(event.proposalId, leadId);

    if (slotsAvailable !== undefined && slotsAvailable < role.slotsFilled) {
        throw new ValidationError("slotsAvailable cannot be less than current slotsFilled");
    }

    await roleRepo().update(Number(roleId), {
        ...(roleName !== undefined && { roleName }),
        ...(description !== undefined && { description }),
        ...(slotsAvailable !== undefined && { slotsAvailable }),
    });

    const updated = await roleRepo().findOne({ where: { id: Number(roleId) } });
    return {
        roleId: updated.id,
        roleName: updated.roleName,
        description: updated.description,
        slotsAvailable: updated.slotsAvailable,
        slotsFilled: updated.slotsFilled,
    };
};

// ── Lead — Delete a role (cascade drop all applications) ─────────────────────

export const deleteRole = async (roleId, leadId) => {
    const id = Number(roleId);
    const role = await roleRepo().findOne({ where: { id } });
    if (!role) throw new NotFoundError("Role not found");

    const event = await eventRepo().findOne({ where: { id: role.eventId } });
    if (!event) throw new NotFoundError("Event not found");
    await assertLeadOwnsEvent(event.proposalId, leadId);

    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(
            "VolunteeringApplication",
            { roleId: id, status: In(["pending", "accepted"]) },
            { status: "rejected", reviewedAt: new Date(), rejectionMessage: "Role was deleted" }
        );
        await queryRunner.manager.delete("VolunteeringRole", { id });
        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
};

// ── Student — Apply to a role ─────────────────────────────────────────────────

export const applyToRole = async (studentId, body) => {
    const { roleId, reason } = body;
    const role = await roleRepo().findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundError("Role not found");

    const event = await eventRepo().findOne({ where: { id: role.eventId } });
    const club = await clubRepo().findOne({
        where: { id: event.clubId }
    });

    if (!club) {
        throw new NotFoundError("Club not found");
    }

    const isLead = club.leadId === studentId;

    const isCommittee = await clubMemberRepo().findOne({
        where: {
            clubId: event.clubId,
            userId: studentId,
        },
    });

    if (!isLead && !isCommittee) {
        throw new ForbiddenError(
            "Only members of this club may volunteer for this event"
        );
    }
    if (!event) throw new NotFoundError("Event not found");
    if (event.volunteeringStatus !== "open") throw new ConflictError("Volunteering for this event is not open");
    if (role.slotsFilled >= role.slotsAvailable) throw new ConflictError("This role is full");

    // Find any existing application for this event, regardless of role or status
    let application = await appRepo().findOne({
        where: { studentId, eventId: role.eventId }
    });

    if (application) {
        if (["pending", "accepted"].includes(application.status)) {
            throw new ConflictError("You have already applied to volunteer for this event");
        }

        // Re-activate rejected application, updating the roleId if they chose a new one
        application.roleId = roleId;
        application.status = "pending";
        application.reason = reason;
        application.appliedAt = new Date();
        application.reviewedAt = null;
        application.rejectionMessage = null;
        await appRepo().save(application);
    } else {
        application = await appRepo().save(
            appRepo().create({ studentId, roleId, eventId: role.eventId, status: "pending", reason })
        );
    }

    return {
        applicationId: application.id,
        roleId,
        status: "pending",
        appliedAt: application.appliedAt,
    };
};

// ── Student — View own applications ──────────────────────────────────────────

export const getMyApplications = async (studentId) => {
    const applications = await appRepo().find({
        where: { studentId },
        order: { appliedAt: "DESC" },
    });

    if (applications.length === 0) return { applications: [] };

    const roleIds = [...new Set(applications.map(a => a.roleId))];
    const eventIds = [...new Set(applications.map(a => a.eventId))];

    const roles = await roleRepo().findBy({ id: In(roleIds) });
    const events = await eventRepo().findBy({ id: In(eventIds) });

    const roleMap = Object.fromEntries(roles.map(r => [r.id, r]));
    const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

    return {
        applications: applications.map(a => ({
            applicationId: a.id,
            eventId: eventMap[a.eventId]?.proposalId ?? a.eventId,
            eventName: eventMap[a.eventId]?.name ?? "Unknown Event",
            eventDate: eventMap[a.eventId]?.eventDate ?? null,
            roleId: a.roleId,
            roleName: roleMap[a.roleId]?.roleName ?? "Unknown Role",
            status: a.status,
            appliedAt: a.appliedAt,
            reviewedAt: a.reviewedAt,
        })),
    };
};



// ── Lead — Decide on a volunteer application ──────────────────────────────────

export const decideVolunteerApplication = async (applicationId, leadId, decision, rejectionMessage) => {
    const aid = Number(applicationId);

    const application = await appRepo().findOne({ where: { id: aid } });
    if (!application) throw new NotFoundError("Application not found");

    const event = await eventRepo().findOne({ where: { id: application.eventId } });
    if (!event) throw new NotFoundError("Event not found");
    await assertLeadOwnsEvent(event.proposalId, leadId);

    const role = await roleRepo().findOne({ where: { id: application.roleId } });
    if (!role || role.eventId !== application.eventId) throw new ForbiddenError("Application does not belong to this event");

    if (!["accepted", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'accepted' or 'rejected'");
    if (application.status !== "pending") throw new ValidationError("Only pending applications can be reviewed");

    await appRepo().update(aid, {
        status: decision,
        reviewedAt: new Date(),
        ...(decision === "rejected" && rejectionMessage ? { rejectionMessage } : {}),
    });

    if (decision === "accepted") {
        await roleRepo().update(application.roleId, { slotsFilled: () => "slots_filled + 1" });
        const updatedRole = await roleRepo().findOne({ where: { id: application.roleId } });
        if (updatedRole && updatedRole.slotsFilled >= updatedRole.slotsAvailable) {
            const allRoles = await roleRepo().find({ where: { eventId: application.eventId } });
            const allFull = allRoles.every(r => r.slotsFilled >= r.slotsAvailable);
            if (allFull) await eventRepo().update(application.eventId, { volunteeringStatus: "full" });
        }
    }

    return { applicationId: aid, status: decision };
};

// ── Lead — Get all volunteer applications for a club's events ─────────────────

export const getClubVolunteerApplications = async (clubId, leadId) => {
    const cid = Number(clubId);

    // Verify lead owns this club
    const club = await clubRepo().findOne({ where: { id: cid } });
    if (!club) throw new NotFoundError("Club not found");
    if (club.leadId !== leadId) throw new ForbiddenError("You do not own this club");

    // Get all events for this club
    const events = await eventRepo().find({ where: { clubId: cid } });
    if (events.length === 0) return { applications: [] };

    const eventIds = events.map(e => e.id);
    const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

    // Get all roles for those events
    const roles = await roleRepo().find({ where: { eventId: In(eventIds) } });
    const roleMap = Object.fromEntries(roles.map(r => [r.id, r]));

    // Get all applications for those events (pending first, then others)
    const applications = await appRepo().find({
        where: { eventId: In(eventIds) },
        order: { appliedAt: "DESC" },
    });
    if (applications.length === 0) return { applications: [] };

    // Lookup student details
    const { UserEntity } = await import("../users/users.entity.mjs");
    const userRepo = () => appDataSource.getRepository(UserEntity);
    const studentIds = [...new Set(applications.map(a => a.studentId))];
    const students = await userRepo().findByIds(studentIds);
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    return {
        applications: applications.map(app => ({
            applicationId: app.id,
            studentName: studentMap[app.studentId]?.fullName ?? "Unknown",
            studentMatricId: studentMap[app.studentId]?.staffOrMatricId ?? null,
            eventId: app.eventId,
            eventName: eventMap[app.eventId]?.name ?? "Unknown Event",
            roleName: roleMap[app.roleId]?.roleName ?? "Volunteer",
            status: app.status,
            appliedAt: app.appliedAt,
            reason: app.reason ?? null,
            rejectionMessage: app.rejectionMessage ?? null,
        })),
    };
};
