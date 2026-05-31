import { In } from "typeorm";
import appDataSource from "../../config/dbConfig.mjs";
import { VolunteeringRoleEntity } from "./volunteering_roles.entity.mjs";
import { VolunteeringApplicationEntity } from "./volunteering_applications.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../shared/errors.mjs";

const roleRepo     = () => appDataSource.getRepository(VolunteeringRoleEntity);
const appRepo      = () => appDataSource.getRepository(VolunteeringApplicationEntity);
const eventRepo    = () => appDataSource.getRepository(EventEntity);
const clubRepo     = () => appDataSource.getRepository(ClubEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);

async function assertLeadOwnsEvent(eventId, leadId) {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
    if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
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
    const roles    = await roleRepo().find({ where: { eventId: In(eventIds) } });

    const clubIds = [...new Set(events.map(e => e.clubId))];
    const clubs   = await clubRepo().findBy({ id: In(clubIds) });
    const clubMap = Object.fromEntries(clubs.map(c => [c.id, c]));

    const rolesByEvent = {};
    for (const role of roles) {
        if (!rolesByEvent[role.eventId]) rolesByEvent[role.eventId] = [];
        rolesByEvent[role.eventId].push({
            roleId:         role.id,
            roleName:       role.roleName,
            description:    role.description ?? null,
            slotsAvailable: role.slotsAvailable,
            slotsFilled:    role.slotsFilled,
        });
    }

    return {
        events: events.map(e => ({
            eventId:   e.id,
            eventName: e.name,
            eventDate: e.eventDate,
            clubName:  clubMap[e.clubId]?.name ?? "Unknown Club",
            roles:     rolesByEvent[e.id] ?? [],
        })),
    };
};

// ── Lead — Create a volunteering role ─────────────────────────────────────────

export const createRole = async (eventId, leadId, body) => {
    const { roleName, description, slotsAvailable } = body;

    if (!roleName) throw new ValidationError("roleName is required");
    if (!slotsAvailable || slotsAvailable < 1) throw new ValidationError("slotsAvailable must be at least 1");

    await assertLeadOwnsEvent(Number(eventId), leadId);

    const role = await roleRepo().save(
        roleRepo().create({
            eventId: Number(eventId),
            roleName,
            description: description ?? null,
            slotsAvailable,
            slotsFilled: 0,
        })
    );

    return {
        roleId:         role.id,
        roleName:       role.roleName,
        description:    role.description,
        slotsAvailable: role.slotsAvailable,
        slotsFilled:    0,
    };
};

// ── Lead — Update a volunteering role ─────────────────────────────────────────

export const updateRole = async (roleId, leadId, body) => {
    const { roleName, description, slotsAvailable } = body;

    const role = await roleRepo().findOne({ where: { id: Number(roleId) } });
    if (!role) throw new NotFoundError("Role not found");

    await assertLeadOwnsEvent(role.eventId, leadId);

    if (slotsAvailable !== undefined && slotsAvailable < role.slotsFilled) {
        throw new ValidationError("slotsAvailable cannot be less than current slotsFilled");
    }

    await roleRepo().update(Number(roleId), {
        ...(roleName !== undefined      && { roleName }),
        ...(description !== undefined   && { description }),
        ...(slotsAvailable !== undefined && { slotsAvailable }),
    });

    const updated = await roleRepo().findOne({ where: { id: Number(roleId) } });
    return {
        roleId:         updated.id,
        roleName:       updated.roleName,
        description:    updated.description,
        slotsAvailable: updated.slotsAvailable,
        slotsFilled:    updated.slotsFilled,
    };
};

// ── Lead — Delete a role (cascade drop all applications) ─────────────────────

export const deleteRole = async (roleId, leadId) => {
    const id = Number(roleId);
    const role = await roleRepo().findOne({ where: { id } });
    if (!role) throw new NotFoundError("Role not found");

    await assertLeadOwnsEvent(role.eventId, leadId);

    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(
            "VolunteeringApplication",
            { roleId: id, status: In(["pending", "accepted"]) },
            { status: "dropped", reviewedAt: new Date() }
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

export const applyToRole = async (studentId, roleId) => {
    const role = await roleRepo().findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundError("Role not found");

    const event = await eventRepo().findOne({ where: { id: role.eventId } });
    if (!event) throw new NotFoundError("Event not found");
    if (event.volunteeringStatus !== "open") throw new ConflictError("Volunteering for this event is not open");
    if (role.slotsFilled >= role.slotsAvailable) throw new ConflictError("This role is full");

    const existing = await appRepo().findOne({
        where: { studentId, eventId: role.eventId, status: In(["pending", "accepted"]) },
    });
    if (existing) throw new ConflictError("You have already applied to volunteer for this event");

    const application = await appRepo().save(
        appRepo().create({ studentId, roleId, eventId: role.eventId, status: "pending" })
    );

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

    const roleIds  = [...new Set(applications.map(a => a.roleId))];
    const eventIds = [...new Set(applications.map(a => a.eventId))];

    const roles  = await roleRepo().findBy({ id: In(roleIds) });
    const events = await eventRepo().findBy({ id: In(eventIds) });

    const roleMap  = Object.fromEntries(roles.map(r => [r.id, r]));
    const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

    return {
        applications: applications.map(a => ({
            applicationId: a.id,
            eventId:       a.eventId,
            eventName:     eventMap[a.eventId]?.name ?? "Unknown Event",
            eventDate:     eventMap[a.eventId]?.eventDate ?? null,
            roleId:        a.roleId,
            roleName:      roleMap[a.roleId]?.roleName ?? "Unknown Role",
            status:        a.status,
            appliedAt:     a.appliedAt,
            reviewedAt:    a.reviewedAt,
        })),
    };
};

// ── Student + Lead — Drop an application ─────────────────────────────────────

export const dropApplication = async (applicationId, userId, userRole) => {
    const application = await appRepo().findOne({ where: { id: applicationId } });
    if (!application) throw new NotFoundError("Application not found");

    if (["dropped", "rejected"].includes(application.status)) {
        throw new ConflictError("Application is already dropped or rejected");
    }

    if (userRole === "student" || userRole === "member") {
        if (application.studentId !== userId) {
            throw new ForbiddenError("This application does not belong to you");
        }
    } else {
        await assertLeadOwnsEvent(application.eventId, userId);
    }

    const wasAccepted = application.status === "accepted";

    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(
            "VolunteeringApplication",
            { id: applicationId },
            { status: "dropped", reviewedAt: new Date() }
        );

        if (wasAccepted) {
            await queryRunner.manager.update(
                "VolunteeringRole",
                { id: application.roleId },
                { slotsFilled: () => "slots_filled - 1" }
            );

            const event = await eventRepo().findOne({ where: { id: application.eventId } });
            if (event?.volunteeringStatus === "full") {
                await queryRunner.manager.update(
                    "Event",
                    { id: application.eventId },
                    { volunteeringStatus: "open" }
                );
            }
        }

        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
};
