import { In } from "typeorm";
import appDataSource from "../../config/dbConfig.mjs";
import { CertificateEntity } from "./certificates.entity.mjs";
import { VolunteeringApplicationEntity } from "../volunteering/volunteering_applications.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "../shared/errors.mjs";

const certRepo     = () => appDataSource.getRepository(CertificateEntity);
const appRepo      = () => appDataSource.getRepository(VolunteeringApplicationEntity);
const eventRepo    = () => appDataSource.getRepository(EventEntity);
const proposalRepo = () => appDataSource.getRepository(EventProposalEntity);
const userRepo     = () => appDataSource.getRepository(UserEntity);

async function assertLeadOwnsEvent(eventId, leadId) {
    const event = await eventRepo().findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundError("Event not found");
    const proposal = await proposalRepo().findOne({ where: { id: event.proposalId } });
    if (!proposal || proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");
    return event;
}

// ── Lead — Get accepted volunteers with certificate status ────────────────────

export const getEventVolunteers = async (eventId, leadId) => {
    await assertLeadOwnsEvent(Number(eventId), leadId);

    const applications = await appRepo().find({
        where: { eventId: Number(eventId), status: "accepted" },
    });

    if (applications.length === 0) return { volunteers: [] };

    const studentIds = [...new Set(applications.map(a => a.studentId))];
    const users      = await userRepo().findBy({ id: In(studentIds) });
    const userMap    = Object.fromEntries(users.map(u => [u.id, u]));

    const certs  = await certRepo().find({ where: { eventId: Number(eventId), type: "volunteer" } });
    const certSet = new Set(certs.map(c => c.userId));

    return {
        volunteers: applications.map(a => ({
            applicationId:  a.id,
            userId:         a.studentId,
            name:           userMap[a.studentId]?.fullName ?? "Unknown",
            hasCertificate: certSet.has(a.studentId),
        })),
    };
};

// ── Lead — Issue certificates to selected volunteers ──────────────────────────

export const issueCertificates = async (eventId, leadId, applicationIds) => {
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        throw new ValidationError("applicationIds must be a non-empty array");
    }

    const event = await assertLeadOwnsEvent(Number(eventId), leadId);
    if (event.status !== "completed") throw new ConflictError("Event is not completed");

    const applications = await appRepo().findBy({ id: In(applicationIds) });
    const validApps    = applications.filter(
        a => a.eventId === Number(eventId) && a.status === "accepted"
    );

    if (validApps.length === 0) return { issued: [], skipped: [] };

    const studentIds = validApps.map(a => a.studentId);
    const users      = await userRepo().findBy({ id: In(studentIds) });
    const userMap    = Object.fromEntries(users.map(u => [u.id, u]));

    const issued  = [];
    const skipped = [];

    for (const app of validApps) {
        try {
            await certRepo().insert({ userId: app.studentId, eventId: Number(eventId), type: "volunteer" });
            issued.push({ userId: app.studentId, name: userMap[app.studentId]?.fullName ?? "Unknown" });
        } catch (err) {
            if (err.code === "23505") {
                skipped.push({ userId: app.studentId, name: userMap[app.studentId]?.fullName ?? "Unknown" });
            } else {
                throw err;
            }
        }
    }

    return { issued, skipped };
};

// ── Student / Member — Get own certificates ───────────────────────────────────

export const getMyCertificates = async (userId) => {
    const certs = await certRepo().find({ where: { userId }, order: { issuedAt: "DESC" } });

    if (certs.length === 0) return { certificates: [] };

    const eventIds = [...new Set(certs.map(c => c.eventId))];
    const events   = await eventRepo().findBy({ id: In(eventIds) });
    const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

    return {
        certificates: certs.map(c => ({
            certificateId: c.id,
            eventId:       c.eventId,
            eventName:     eventMap[c.eventId]?.name ?? "Unknown Event",
            eventDate:     eventMap[c.eventId]?.eventDate ?? null,
            type:          c.type,
            issuedAt:      c.issuedAt,
        })),
    };
};

// ── Any auth — Fetch cert data for PDF generation ─────────────────────────────

export const getCertificateForDownload = async (certId, userId) => {
    const cert = await certRepo().findOne({ where: { id: Number(certId) } });
    if (!cert) throw new NotFoundError("Certificate not found");
    if (cert.userId !== userId) throw new ForbiddenError("This certificate does not belong to you");

    const [user, event] = await Promise.all([
        userRepo().findOne({ where: { id: cert.userId } }),
        eventRepo().findOne({ where: { id: cert.eventId } }),
    ]);

    return {
        recipientName:  user?.fullName ?? "Unknown",
        eventName:      event?.name ?? "Unknown Event",
        eventDateStart: event?.eventDate ?? null,
        role:           "Volunteer",
    };
};