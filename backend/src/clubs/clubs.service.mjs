import appDataSource from "../../config/dbConfig.mjs";
import { ClubEntity } from "./clubs.entity.mjs";
import { ClubMemberEntity } from "./club_members.entity.mjs";
import { ClubRequestEntity } from "./club_requests.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { MembershipRequestEntity } from "../requests/membership_requests.entity.mjs";
import { In } from "typeorm";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "../shared/errors.mjs";

const clubRepo           = () => appDataSource.getRepository(ClubEntity);
const clubMemberRepo     = () => appDataSource.getRepository(ClubMemberEntity);
const clubRequestRepo    = () => appDataSource.getRepository(ClubRequestEntity);
const userRepo           = () => appDataSource.getRepository(UserEntity);
const proposalRepo       = () => appDataSource.getRepository(EventProposalEntity);
const eventRepo          = () => appDataSource.getRepository(EventEntity);
const membershipReqRepo  = () => appDataSource.getRepository(MembershipRequestEntity);

const VALID_STATUSES = ["pending", "approved", "rejected"];

export const listClubs = async () => {
    return clubRepo().find();
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
        const student = await userRepo().findOne({ where: { id: request.studentId } });
        if (student.role === "lead") {
            throw new ConflictError("Student is already leading another club");
        }

        const existingClub = await clubRepo().findOne({ where: { name: request.clubName } });
        if (existingClub) {
            throw new ConflictError("A club with this name already exists");
        }

        // TODO: If the student is currently a 'member', their club_members row is not removed here.
        // This was deferred — see memory: deferred-member-cleanup.
        const club = clubRepo().create({
            name: request.clubName,
            type: request.clubType,
            description: request.description,
            leadId: request.studentId,
        });
        const savedClub = await clubRepo().save(club);

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

// ── Lead — Get my club overview ───────────────────────────────────────────────

export const getMyClub = async (leadId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");

    const memberCount = await clubMemberRepo().count({ where: { clubId: club.id } });
    const proposals   = await proposalRepo().find({ where: { clubId: club.id } });

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
        id:             club.id,
        name:           club.name,
        type:           club.type,
        description:    club.description,
        memberCount:    memberCount + 1, // include lead
        eventStats:     stats,
        pendingRequests,
    };
};

// ── Lead — List club members ──────────────────────────────────────────────────

export const getMyClubMembers = async (leadId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");

    const lead    = await userRepo().findOne({ where: { id: leadId } });
    const records = await clubMemberRepo().find({ where: { clubId: club.id } });

    const memberIds  = records.map(r => r.userId);
    const memberUsers = memberIds.length
        ? await userRepo().findBy({ id: In(memberIds) })
        : [];
    const userMap = Object.fromEntries(memberUsers.map(u => [u.id, u]));

    return [
        {
            userId:         lead.id,
            fullName:       lead.fullName,
            staffOrMatricId: lead.staffOrMatricId ?? null,
            role:           "lead",
            joinedAt:       club.createdAt,
        },
        ...records.map(r => {
            const u = userMap[r.userId];
            return {
                userId:          r.userId,
                fullName:        u?.fullName ?? "Unknown",
                staffOrMatricId: u?.staffOrMatricId ?? null,
                role:            "committee",
                joinedAt:        r.joinedAt,
            };
        }),
    ];
};

// ── Lead — List pending membership requests ───────────────────────────────────

export const getMembershipRequests = async (leadId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");

    const requests = await membershipReqRepo().find({
        where: { clubId: club.id, status: "pending" },
        order: { submittedAt: "DESC" },
    });
    if (!requests.length) return [];

    const studentIds = requests.map(r => r.studentId);
    const students   = await userRepo().findBy({ id: In(studentIds) });
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    return requests.map(r => ({
        id:              r.id,
        studentName:     studentMap[r.studentId]?.fullName ?? "Unknown",
        studentMatricId: studentMap[r.studentId]?.staffOrMatricId ?? null,
        submittedAt:     r.submittedAt,
        status:          r.status,
    }));
};

// ── Lead — Accept or reject a membership request ──────────────────────────────

export const decideMembershipRequest = async (leadId, requestId, decision) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");

    const req = await membershipReqRepo().findOne({ where: { id: Number(requestId) } });
    if (!req) throw new NotFoundError("Membership request not found");
    if (req.clubId !== club.id) throw new ForbiddenError("Request does not belong to your club");
    if (req.status !== "pending") throw new ValidationError("Request has already been reviewed");
    if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be 'approved' or 'rejected'");

    await membershipReqRepo().update(Number(requestId), {
        status:     decision,
        reviewedBy: leadId,
        reviewedAt: new Date(),
    });

    if (decision === "approved") {
        const already = await clubMemberRepo().findOne({ where: { userId: req.studentId } });
        if (!already) {
            await clubMemberRepo().save(clubMemberRepo().create({ userId: req.studentId, clubId: club.id }));
            const student = await userRepo().findOne({ where: { id: req.studentId } });
            if (student?.role === "student") {
                await userRepo().update(req.studentId, { role: "member" });
            }
        }
    }

    return { requestId: Number(requestId), decision };
};

// ── Lead — Remove a member from the club ─────────────────────────────────────

export const removeMember = async (leadId, userId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not leading any club");
    if (userId === leadId) throw new ForbiddenError("Cannot remove yourself as lead");

    const member = await clubMemberRepo().findOne({ where: { userId, clubId: club.id } });
    if (!member) throw new NotFoundError("Member not found in your club");

    await clubMemberRepo().delete({ userId, clubId: club.id });
    await userRepo().update(userId, { role: "student" });

    return { message: "Member removed" };
};
