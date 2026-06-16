import appDataSource from "../../config/dbConfig.mjs";
import { ClubEntity } from "./clubs.entity.mjs";
import { ClubMemberEntity } from "./club_members.entity.mjs";
import { ClubRequestEntity } from "./club_requests.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { VenueEntity } from "../venues/venues.entity.mjs";
import { MembershipRequestEntity } from "../requests/membership_requests.entity.mjs";
import { LeadRoleRequestEntity } from "../requests/lead_role_requests.entity.mjs";
import { In } from "typeorm";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "../shared/errors.mjs";

const clubRepo           = () => appDataSource.getRepository(ClubEntity);
const clubMemberRepo     = () => appDataSource.getRepository(ClubMemberEntity);
const clubRequestRepo    = () => appDataSource.getRepository(ClubRequestEntity);
const userRepo           = () => appDataSource.getRepository(UserEntity);
const proposalRepo       = () => appDataSource.getRepository(EventProposalEntity);
const eventRepo          = () => appDataSource.getRepository(EventEntity);
const venueRepo          = () => appDataSource.getRepository(VenueEntity);
const membershipReqRepo  = () => appDataSource.getRepository(MembershipRequestEntity);

const VALID_STATUSES = ["pending", "approved", "rejected"];

export const listClubs = async () => {
    const clubs = await clubRepo().find({
        where: {
            deletedAt: null,
        },
        order: {
            createdAt: "DESC",
        },
    });

    if (!clubs.length) return [];

    const leadIds = clubs
        .map((club) => club.leadId)
        .filter(Boolean);

    const leads = leadIds.length
        ? await userRepo().findBy({ id: In(leadIds) })
        : [];

    const leadMap = Object.fromEntries(
        leads.map((lead) => [lead.id, lead])
    );

    const result = await Promise.all(
        clubs.map(async (club) => {
            const memberCount = await clubMemberRepo().count({
                where: { clubId: club.id },
            });

            const lead = club.leadId ? leadMap[club.leadId] : null;

            return {
                id: club.id,
                name: club.name,
                type: club.type,
                description: club.description,
                leadId: club.leadId,
                lead: lead
                    ? {
                        id: lead.id,
                        fullName: lead.fullName,
                        staffOrMatricId: lead.staffOrMatricId,
                        email: lead.email,
                    }
                    : null,
                memberCount: memberCount + (lead ? 1 : 0),
                createdAt: club.createdAt,
            };
        })
    );

    return result;
};

export const createClubRequest = async (userId, { clubName, clubType, description, category, supportingLetterPath }) => {
    if (!clubName?.trim()) throw new ValidationError("Club name is required");
    if (!["club", "community"].includes(clubType)) throw new ValidationError("clubType must be 'club' or 'community'");
    if (!description?.trim()) throw new ValidationError("Description is required");

    const request = clubRequestRepo().create({
        studentId: userId,
        clubName: clubName.trim(),
        clubType,
        description: description.trim(),
        category: category?.trim() || null,
        supportingLetterPath: supportingLetterPath || null,
        status: "pending",
    });

    try {
        await clubRequestRepo().save(request);
    } catch (err) {
        if (err.code === "23505") throw new ConflictError("You already have a pending club request");
        throw err;
    }

    return { message: "Club request submitted for admin review" };
};

export const listClubRequests = async ({ status, search }) => {
    if (status && status !== "all" && !VALID_STATUSES.includes(status)) {
        throw new ValidationError("Invalid status value. Must be pending, approved, rejected, or all");
    }

    const where = {};
    if (status && status !== "all") where.status = status;

    const requests = await clubRequestRepo().find({ where, order: { submittedAt: "DESC" } });

    if (requests.length === 0) return [];

    const studentIds = [...new Set(requests.map(r => r.studentId))];
    const students = await userRepo().find({ where: { id: In(studentIds) } });
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    let result = requests.map(r => {
        const student = studentMap[r.studentId];
        return {
            id: r.id,
            clubName: r.clubName,
            clubType: r.clubType,
            description: r.description,
            category: r.category ?? null,
            supportingLetterPath: r.supportingLetterPath ?? null,
            status: r.status,
            adminComment: r.adminComment,
            submittedAt: r.submittedAt,
            reviewedAt: r.reviewedAt,
            student: student ? {
                id: student.id,
                fullName: student.fullName,
                staffOrMatricId: student.staffOrMatricId,
            } : null,
        };
    });

    if (search) {
        const term = search.toLowerCase();
        result = result.filter(r =>
            r.clubName.toLowerCase().includes(term) ||
            r.student?.fullName?.toLowerCase().includes(term)
        );
    }

    return result;
};

export const getClubRequest = async (requestId) => {
    const request = await clubRequestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Club request not found");

    const student = await userRepo().findOne({ where: { id: request.studentId } });

    return {
        id: request.id,
        clubName: request.clubName,
        clubType: request.clubType,
        description: request.description,
        status: request.status,
        adminComment: request.adminComment,
        resultClubId: request.resultClubId,
        submittedAt: request.submittedAt,
        reviewedAt: request.reviewedAt,
        student: student ? {
            id: student.id,
            fullName: student.fullName,
            staffOrMatricId: student.staffOrMatricId,
            email: student.email,
        } : null,
    };
};

export const decideClubRequest = async (requestId, adminId, action, adminComment) => {
    if (!action || !["approved", "rejected"].includes(action)) {
        throw new ValidationError("action must be 'approved' or 'rejected'");
    }

    const request = await clubRequestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Club request not found");

    if (request.status !== "pending") {
        throw new ConflictError("This club request has already been reviewed");
    }

    if (action === "approved") {
        const existingClub = await clubRepo().findOne({ where: { name: request.clubName } });
        if (existingClub) {
            throw new ConflictError("A club with this name already exists");
        }

        const club = clubRepo().create({
            name: request.clubName,
            type: request.clubType,
            description: request.description,
            category: request.category ?? null,
            leadId: request.studentId,
        });
        const savedClub = await clubRepo().save(club);

        // Upgrade role to lead if not already — existing leads keep their role
        await userRepo().update(request.studentId, { role: "lead" });

        const updateData = {
            status: "approved",
            adminId,
            resultClubId: savedClub.id,
            reviewedAt: new Date(),
        };
        if (adminComment?.trim()) updateData.adminComment = adminComment.trim();
        await clubRequestRepo().update(parseInt(requestId), updateData);

        return { message: "Club request approved" };
    }

    // action === "rejected"
    if (!adminComment || !adminComment.trim()) {
        throw new ValidationError("adminComment is required when rejecting a request");
    }

    await clubRequestRepo().update(parseInt(requestId), {
        status: "rejected",
        adminId,
        adminComment: adminComment.trim(),
        reviewedAt: new Date(),
    });

    return { message: "Club request rejected" };
};

// ── Lead — Get single club overview (kept for profile page compat) ────────────

export const getMyClub = async (leadId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");

    const memberCount = await clubMemberRepo().count({ where: { clubId: club.id } });
    const proposals = await proposalRepo().find({ where: { clubId: club.id } });

    const stats = proposals.reduce(
        (acc, p) => {
            acc.total++;
            if (p.status === "approved") acc.approved++;
            else if (p.status === "rejected") acc.rejected++;
            return acc;
        },
        { total: 0, approved: 0, rejected: 0 },
    );

    const pendingRequests = await membershipReqRepo().count({
        where: { clubId: club.id, status: "pending" },
    });

    return {
        id: club.id,
        name: club.name,
        type: club.type,
        description: club.description,
        memberCount: memberCount + 1, // include lead
        eventStats: stats,
        id: club.id,
        name: club.name,
        type: club.type,
        description: club.description,
        memberCount: memberCount + 1,
        eventStats: stats,
        pendingRequests,
    };
};

// ── Lead — Get all clubs + pending requests ───────────────────────────────────

const buildClubStats = async (club) => {
    const memberCount = await clubMemberRepo().count({ where: { clubId: club.id } });
    const proposals = await proposalRepo().find({ where: { clubId: club.id } });
    const stats = proposals.reduce(
        (acc, p) => {
            acc.total++;
            if (p.status === "approved") acc.approved++;
            else if (p.status === "rejected") acc.rejected++;
            return acc;
        },
        { total: 0, approved: 0, rejected: 0 },
    );
    const pendingRequests = await membershipReqRepo().count({
        where: { clubId: club.id, status: "pending" },
    });
    return {
        status: "approved",
        id: club.id,
        name: club.name,
        type: club.type,
        description: club.description,
        leadId: club.leadId,
        memberCount: memberCount + 1,
        eventStats: stats,
        pendingRequests,
    };
};

export const getMyClubs = async (userId) => {
    // Clubs where the user is the lead
    const leadClubs = await clubRepo().find({ where: { leadId: userId } });
    const approvedLeadClubs = await Promise.all(
        leadClubs.map(c => buildClubStats(c).then(s => ({ ...s, userRole: "lead" })))
    );

    // Clubs where the user is a member (not a lead)
    const memberRows = await clubMemberRepo().find({ where: { userId } });
    const memberClubIds = memberRows.map(r => r.clubId).filter(id =>
        !leadClubs.some(lc => lc.id === id)
    );
    const memberClubEntities = memberClubIds.length
        ? await clubRepo().findBy({ id: In(memberClubIds) })
        : [];
    const approvedMemberClubs = await Promise.all(
        memberClubEntities.map(async c => {
            const memberCount = await clubMemberRepo().count({ where: { clubId: c.id } });
            return {
                status: "approved",
                id: c.id,
                name: c.name,
                type: c.type,
                description: c.description,
                leadId: c.leadId,
                memberCount: memberCount + (c.leadId ? 1 : 0),
                eventStats: { total: 0, approved: 0, rejected: 0 },
                pendingRequests: 0,
                userRole: "member",
            };
        })
    );

    // Pending/rejected club creation requests by this user
    const pendingReqs = await clubRequestRepo().find({
        where: { studentId: userId, status: In(["pending", "rejected"]) },
        order: { submittedAt: "DESC" },
    });
    const pendingClubs = pendingReqs.map(r => ({
        status: r.status,
        requestId: r.id,
        name: r.clubName,
        type: r.clubType,
        description: r.description,
        category: r.category ?? null,
        submittedAt: r.submittedAt,
        adminComment: r.adminComment ?? null,
    }));

    return [...approvedLeadClubs, ...approvedMemberClubs, ...pendingClubs];
};

// ── Shared helper — resolve lead's club by optional clubId ────────────────────

const resolveLeadClub = async (leadId, clubId) => {
    const where = clubId ? { id: parseInt(clubId), leadId } : { leadId };
    const club = await clubRepo().findOne({ where });
    if (!club) throw new NotFoundError("Club not found or you are not its lead");
    return club;
};

// ── Lead — List club members ──────────────────────────────────────────────────

export const getMyClubMembers = async (leadId, clubId) => {
    const club = await resolveLeadClub(leadId, clubId);

    const lead = await userRepo().findOne({ where: { id: leadId } });
    const records = await clubMemberRepo().find({ where: { clubId: club.id } });

    const memberIds = records.map(r => r.userId);
    const memberUsers = memberIds.length
        ? await userRepo().findBy({ id: In(memberIds) })
        : [];
    const userMap = Object.fromEntries(memberUsers.map(u => [u.id, u]));

    return [
        {
            userId: lead.id,
            fullName: lead.fullName,
            staffOrMatricId: lead.staffOrMatricId ?? null,
            role: "lead",
            joinedAt: club.createdAt,
        },
        ...records.map(r => {
            const u = userMap[r.userId];
            return {
                userId: r.userId,
                fullName: u?.fullName ?? "Unknown",
                staffOrMatricId: u?.staffOrMatricId ?? null,
                role: "committee",
                joinedAt: r.joinedAt,
            };
        }),
    ];
};

// ── Lead — List pending membership requests ───────────────────────────────────

export const getMembershipRequests = async (leadId, clubId) => {
    const club = await resolveLeadClub(leadId, clubId);

    const requests = await membershipReqRepo().find({
        where: { clubId: club.id, status: "pending" },
        order: { submittedAt: "DESC" },
    });
    if (!requests.length) return [];

    const studentIds = requests.map(r => r.studentId);
    const students = await userRepo().findBy({ id: In(studentIds) });
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    return requests.map(r => ({
        id: r.id,
        studentName: studentMap[r.studentId]?.fullName ?? "Unknown",
        studentMatricId: studentMap[r.studentId]?.staffOrMatricId ?? null,
        submittedAt: r.submittedAt,
        status: r.status,
    }));
};

// ── Lead — Accept or reject a membership request ──────────────────────────────

export const decideMembershipRequest = async (leadId, requestId, decision, clubId, leadComment) => {
    const club = await resolveLeadClub(leadId, clubId);

    const req = await membershipReqRepo().findOne({ where: { id: Number(requestId) } });
    if (!req) throw new NotFoundError("Membership request not found");
    if (req.clubId !== club.id) throw new ForbiddenError("Request does not belong to your club");
    if (req.status !== "pending") throw new ValidationError("Request has already been reviewed");
    if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'approved' or 'rejected'");

    if (decision === "approved") {
        // Atomic: if the insert fails the request stays "pending"
        const qr = appDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await qr.manager.update(MembershipRequestEntity, Number(requestId), {
                status: "approved",
                reviewedBy: leadId,
                reviewedAt: new Date(),
            });
            const already = await qr.manager.findOne(ClubMemberEntity, { where: { userId: req.studentId, clubId: club.id } });
            if (!already) {
                await qr.manager.insert(ClubMemberEntity, { userId: req.studentId, clubId: club.id });
                const student = await qr.manager.findOne(UserEntity, { where: { id: req.studentId } });
                if (student?.role === "student") {
                    await qr.manager.update(UserEntity, { id: req.studentId }, { role: "member" });
                }
            }
            await qr.commitTransaction();
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    } else {
        await membershipReqRepo().update(Number(requestId), {
            status: "rejected",
            reviewedBy: leadId,
            reviewedAt: new Date(),
            ...(leadComment ? { leadComment: leadComment.trim() } : {}),
        });
    }

    return { requestId: Number(requestId), decision };
};

// ── Lead — Remove a member from the club ─────────────────────────────────────

export const removeMember = async (leadId, userId, clubId) => {
    const club = await resolveLeadClub(leadId, clubId);
    if (userId === leadId) throw new ForbiddenError("Cannot remove yourself as lead");

    const member = await clubMemberRepo().findOne({ where: { userId, clubId: club.id } });
    if (!member) throw new NotFoundError("Member not found in your club");

    await clubMemberRepo().delete({ userId, clubId: club.id });
    await membershipReqRepo().delete({ studentId: userId, clubId: club.id });

    const remainingMemberships = await clubMemberRepo().count({ where: { userId } });
    if (remainingMemberships === 0) {
        await userRepo().update(userId, { role: "student" });
    }

    return { message: "Member removed" };
};

// ── Admin — helpers ───────────────────────────────────────────────────────────

const buildLeadInfo = async (leadId) => {
    if (!leadId) return null;
    const u = await userRepo().findOne({ where: { id: leadId } });
    if (!u) return null;
    return { id: u.id, fullName: u.fullName, staffOrMatricId: u.staffOrMatricId ?? null, email: u.email };
};

// ── Admin — List all clubs ────────────────────────────────────────────────────

export const adminListClubs = async ({ search } = {}) => {
    const clubs = await clubRepo().find({ order: { createdAt: "DESC" } });

    let result = await Promise.all(clubs.map(async (club) => {
        const memberCount = await clubMemberRepo().count({ where: { clubId: club.id } });
        const lead = await buildLeadInfo(club.leadId);
        return {
            id:          club.id,
            name:        club.name,
            type:        club.type,
            category:    club.category ?? null,
            description: club.description,
            memberCount: memberCount + 1,
            createdAt:   club.createdAt,
            lead,
        };
    }));

    if (search) {
        const term = search.toLowerCase();
        result = result.filter(c =>
            c.name.toLowerCase().includes(term) ||
            (c.lead?.fullName ?? "").toLowerCase().includes(term) ||
            (c.category ?? "").toLowerCase().includes(term)
        );
    }

    return result;
};

// ── Admin — Get club detail ───────────────────────────────────────────────────

export const adminGetClub = async (clubId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const memberCount = await clubMemberRepo().count({ where: { clubId: club.id } });
    const eventCount  = await eventRepo().count({ where: { clubId: club.id } });
    const objectives  = club.objectives ?? [];
    const lead        = await buildLeadInfo(club.leadId);

    return {
        id:             club.id,
        name:           club.name,
        type:           club.type,
        category:       club.category ?? null,
        description:    club.description,
        facultyAdvisor: club.facultyAdvisor ?? null,
        objectives,
        objectiveCount: objectives.length,
        createdAt:      club.createdAt,
        memberCount:    memberCount + 1,
        eventCount,
        lead,
    };
};

// ── Admin — Update club ───────────────────────────────────────────────────────

export const adminUpdateClub = async (clubId, updates) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const allowed = ["name", "description", "category", "facultyAdvisor", "objectives", "leadId"];
    const patch   = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

    if (patch.name && patch.name !== club.name) {
        const existing = await clubRepo().findOne({ where: { name: patch.name } });
        if (existing) throw new ConflictError("A club with this name already exists");
    }

    await clubRepo().update(parseInt(clubId), patch);
    return { message: "Club updated" };
};

// ── Admin — Dissolve club ─────────────────────────────────────────────────────

export const adminDissolveClub = async (clubId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    await clubMemberRepo().delete({ clubId: club.id });
    if (club.leadId) await userRepo().update(club.leadId, { role: "student" });
    await clubRepo().delete(parseInt(clubId));

    return { message: "Club dissolved" };
};

// ── Admin — Get club members ──────────────────────────────────────────────────

export const adminGetClubMembers = async (clubId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const records = await clubMemberRepo().find({ where: { clubId: club.id } });
    const memberIds = records.map(r => r.userId);
    const memberUsers = memberIds.length ? await userRepo().findBy({ id: In(memberIds) }) : [];
    const userMap = Object.fromEntries(memberUsers.map(u => [u.id, u]));

    const committees = records.map(r => {
        const u = userMap[r.userId];
        return {
            userId: r.userId, fullName: u?.fullName ?? "Unknown",
            staffOrMatricId: u?.staffOrMatricId ?? null, email: u?.email ?? "—",
            role: "committee", joinedAt: r.joinedAt,
        };
    });

    if (club.leadId) {
        const leadUser = await userRepo().findOne({ where: { id: club.leadId } });
        if (leadUser) {
            return [{
                userId: leadUser.id, fullName: leadUser.fullName,
                staffOrMatricId: leadUser.staffOrMatricId ?? null, email: leadUser.email,
                role: "lead", joinedAt: club.createdAt,
            }, ...committees];
        }
    }

    return committees;
};

// ── Admin — Change club lead ──────────────────────────────────────────────────

export const changeClubLeadByAdmin = async (clubId, newLeadId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const newLead = await userRepo().findOne({ where: { id: newLeadId } });
    if (!newLead) throw new NotFoundError("New lead user not found");

    if (!["student", "member", "lead"].includes(newLead.role)) {
        throw new ForbiddenError("Only students, members, or existing leads can become a club lead");
    }

    const oldLeadId = club.leadId;

    // Demote the previous lead to member (if one existed and is different)
    if (oldLeadId && oldLeadId !== newLeadId) {
        await userRepo().update(oldLeadId, { role: "member" });
        // Ensure they remain in the members table
        const alreadyMember = await clubMemberRepo().findOne({ where: { clubId: club.id, userId: oldLeadId } });
        if (!alreadyMember) {
            await clubMemberRepo().save(clubMemberRepo().create({ clubId: club.id, userId: oldLeadId }));
        }
    }

    // Remove new lead from members table (lead is not stored as a member row)
    await clubMemberRepo().delete({ clubId: club.id, userId: newLeadId });

    // Promote new lead
    await userRepo().update(newLeadId, { role: "lead" });
    await clubRepo().update(club.id, { leadId: newLeadId });

    return { message: "Club lead updated", clubId: club.id, newLeadId };
};

// ── Admin — Add member to club ────────────────────────────────────────────────

export const addClubMemberByAdmin = async (clubId, userId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const user = await userRepo().findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (club.leadId === userId) throw new ConflictError("User is already the club lead");

    const existing = await clubMemberRepo().findOne({ where: { clubId: club.id, userId } });
    if (existing) throw new ConflictError("User is already a member of this club");

    await clubMemberRepo().save(clubMemberRepo().create({ clubId: club.id, userId }));

    if (user.role === "student") {
        await userRepo().update(userId, { role: "member" });
    }

    return { message: "Member added", userId, clubId: club.id };
};

// ── Admin — Remove club member ────────────────────────────────────────────────

export const adminRemoveClubMember = async (clubId, userId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");
    if (userId === club.leadId) throw new ForbiddenError("Cannot remove the club lead");

    const member = await clubMemberRepo().findOne({ where: { userId, clubId: club.id } });
    if (!member) throw new NotFoundError("Member not found in this club");

    await clubMemberRepo().delete({ userId, clubId: club.id });
    await userRepo().update(userId, { role: "student" });

    return { message: "Member removed" };
};

// ── Admin — Get all club memberships for a user ──────────────────────────────

export const getUserClubMemberships = async (userId) => {
    const [memberRows, leadClubs] = await Promise.all([
        clubMemberRepo().find({ where: { userId } }),
        clubRepo().find({ where: { leadId: userId } }),
    ]);

    const memberClubIds = memberRows.map(r => r.clubId);
    const memberClubs = memberClubIds.length
        ? await clubRepo().findBy({ id: In(memberClubIds) })
        : [];

    return [
        ...leadClubs.map(c => ({ clubId: c.id, clubName: c.name, clubType: c.type, role: "lead" })),
        ...memberClubs.map(c => ({ clubId: c.id, clubName: c.name, clubType: c.type, role: "member" })),
    ];
};

// ── Admin — Demote club lead to member ───────────────────────────────────────

export const demoteLeadToMember = async (clubId, userId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");
    if (club.leadId !== userId) throw new ValidationError("User is not the lead of this club");

    await clubRepo().update(club.id, { leadId: null });

    const existing = await clubMemberRepo().findOne({ where: { clubId: club.id, userId } });
    if (!existing) {
        await clubMemberRepo().save(clubMemberRepo().create({ clubId: club.id, userId }));
    }

    // Only downgrade global role if user is no longer lead of any club
    const stillLead = await clubRepo().findOne({ where: { leadId: userId } });
    if (!stillLead) {
        await userRepo().update(userId, { role: "member" });
    }

    return { message: "Lead demoted to member" };
};

// ── Lead — Resign as lead of own club (self-service) ─────────────────────────

export const resignAsLead = async (leadId, clubId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");
    if (club.leadId !== leadId) throw new ForbiddenError("You are not the lead of this club");

    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        // 1. Club becomes leaderless
        await queryRunner.manager.update("Club", { id: club.id }, { leadId: null });

        // 2. Ex-lead stays in the club as a regular member (guard against composite-PK clash)
        const existing = await queryRunner.manager.findOne("ClubMember", {
            where: { userId: leadId, clubId: club.id },
        });
        if (!existing) {
            await queryRunner.manager.insert("ClubMember", { userId: leadId, clubId: club.id });
        }

        // 3. Downgrade global role only if they no longer lead any other club
        const stillLead = await queryRunner.manager.findOne("Club", { where: { leadId } });
        if (!stillLead) {
            await queryRunner.manager.update("User", { id: leadId }, { role: "member" });
        }

        // 4. Option A — stuck requests for THIS club skip the vacant lead, go to admin
        await queryRunner.manager.update(
            "LeadRoleRequest",
            { currentLeadId: leadId, clubId: club.id, status: "pending_lead" },
            { status: "pending_admin" },
        );

        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }

    return { message: "You have resigned as lead" };
};

// ── Admin — Change per-club role (lead ↔ member) ─────────────────────────────

export const changeClubMemberRole = async (clubId, userId, role) => {
    if (role === "lead") return changeClubLeadByAdmin(clubId, userId);
    if (role === "member") return demoteLeadToMember(clubId, userId);
    throw new ValidationError("Role must be 'lead' or 'member'");
};

// ── Admin — Get club events ───────────────────────────────────────────────────

export const adminGetClubEvents = async (clubId) => {
    const club = await clubRepo().findOne({ where: { id: parseInt(clubId) } });
    if (!club) throw new NotFoundError("Club not found");

    const events = await eventRepo().find({ where: { clubId: club.id }, order: { eventDate: "ASC" } });
    if (!events.length) return [];

    const venueIds  = [...new Set(events.map(e => e.venueId))];
    const venues    = await venueRepo().findBy({ id: In(venueIds) });
    const venueMap  = Object.fromEntries(venues.map(v => [v.id, v]));

    return events.map(e => ({
        id:                 e.id,
        name:               e.name,
        eventDate:          e.eventDate,
        status:             e.status,
        volunteeringStatus: e.volunteeringStatus,
        venueName:          venueMap[e.venueId]?.name ?? null,
    }));
};

// ── Admin — Create official club ──────────────────────────────────────────────

export const adminCreateClub = async ({ name, type, description, category, facultyAdvisor, objectives }) => {
    if (!name?.trim())        throw new ValidationError("Club name is required");
    if (!["club", "community"].includes(type)) throw new ValidationError("type must be 'club' or 'community'");
    if (!description?.trim()) throw new ValidationError("Description is required");

    const existing = await clubRepo().findOne({ where: { name: name.trim() } });
    if (existing) throw new ConflictError("A club with this name already exists");

    const club = clubRepo().create({
        name:           name.trim(),
        type,
        description:    description.trim(),
        category:       category?.trim() || null,
        facultyAdvisor: facultyAdvisor?.trim() || null,
        objectives:     objectives ?? [],
    });

    const saved = await clubRepo().save(club);
    return { message: "Club created", clubId: saved.id };
};

// ── Aliases & additional exports expected by the controller ───────────────────

// Same as adminRemoveClubMember — used by the newer controller import name
export const removeClubMemberByAdmin = adminRemoveClubMember;

// Same as adminUpdateClub — used by the newer controller import name
export const updateClubDetailsByAdmin = adminUpdateClub;

// Same shape as adminGetClubMembers — public-ish lookup by club id
export const getClubMembersByClubId = adminGetClubMembers;

// Same shape as adminGetClubEvents — public-ish lookup by club id
export const getClubEventsByClubId = adminGetClubEvents;

// ── Delete club (with optional reason) ───────────────────────────────────────

export const deleteClub = async (clubId, _userId, _deleteReason) => {
    // Reuse the existing dissolve logic; reason is logged but not stored yet
    return adminDissolveClub(clubId);
};

// ── List users not already in any club (for admin add-member picker) ──────────

export const listUsersWithoutClub = async ({ search } = {}) => {
    // Collect all user IDs that are already club leads or members
    const clubs   = await clubRepo().find({ select: { leadId: true } });
    const members = await clubMemberRepo().find({ select: { userId: true } });

    const occupied = new Set([
        ...clubs.map(c => c.leadId).filter(Boolean),
        ...members.map(m => m.userId),
    ]);

    let users = await userRepo().find({
        where: { role: In(["student", "member"]) },
        order: { fullName: "ASC" },
    });

    // Exclude users already in a club
    users = users.filter(u => !occupied.has(u.id));

    // Optional search filter
    if (search?.trim()) {
        const q = search.trim().toLowerCase();
        users = users.filter(u =>
            u.fullName.toLowerCase().includes(q) ||
            (u.staffOrMatricId ?? "").toLowerCase().includes(q)
        );
    }

    return users.map(u => ({
        id:              u.id,
        fullName:        u.fullName,
        staffOrMatricId: u.staffOrMatricId ?? null,
        email:           u.email,
        role:            u.role,
    }));
};
