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

// ── Lead — My Club ────────────────────────────────────────────────────────────

const resolveLeadClub = async (leadId) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("You are not associated with any club");
    return club;
};

export const getMyClub = async (leadId) => {
    const club = await resolveLeadClub(leadId);

    const [proposals, events, memberCount] = await Promise.all([
        proposalRepo().find({ where: { clubId: club.id } }),
        eventRepo().find({ where: { clubId: club.id } }),
        clubMemberRepo().count({ where: { clubId: club.id } }),
    ]);

    const stats = {
        total:     proposals.length,
        draft:     proposals.filter(p => p.status === "draft").length,
        pending:   proposals.filter(p => p.status === "pending").length,
        approved:  events.filter(e => ["approved", "ongoing"].includes(e.status)).length,
        completed: events.filter(e => e.status === "completed").length,
        reportDue: events.filter(e => e.status === "report_due").length,
        rejected:  proposals.filter(p => p.status === "rejected").length,
    };

    return { ...club, memberCount, stats };
};

export const getMyClubMembers = async (leadId) => {
    const club = await resolveLeadClub(leadId);

    const members = await clubMemberRepo().find({ where: { clubId: club.id } });
    if (members.length === 0) return [];

    const userIds = members.map(m => m.userId);
    const users   = await userRepo().find({ where: { id: In(userIds) } });
    const userMap  = Object.fromEntries(users.map(u => [u.id, u]));

    return members.map(m => {
        const u = userMap[m.userId];
        return {
            userId:          m.userId,
            fullName:        u?.fullName        ?? "Unknown",
            email:           u?.email           ?? "",
            staffOrMatricId: u?.staffOrMatricId ?? "",
            joinedAt:        m.joinedAt,
        };
    });
};

export const getMembershipRequests = async (leadId) => {
    const club = await resolveLeadClub(leadId);

    const requests = await membershipReqRepo().find({
        where: { clubId: club.id, status: "pending" },
        order: { submittedAt: "DESC" },
    });
    if (requests.length === 0) return [];

    const studentIds = requests.map(r => r.studentId);
    const users      = await userRepo().find({ where: { id: In(studentIds) } });
    const userMap    = Object.fromEntries(users.map(u => [u.id, u]));

    return requests.map(r => {
        const u = userMap[r.studentId];
        return {
            id:              r.id,
            studentId:       r.studentId,
            fullName:        u?.fullName        ?? "Unknown",
            email:           u?.email           ?? "",
            staffOrMatricId: u?.staffOrMatricId ?? "",
            submittedAt:     r.submittedAt,
        };
    });
};

export const decideMembershipRequest = async (leadId, requestId, decision) => {
    if (!["approved", "rejected"].includes(decision)) {
        throw new ValidationError("Decision must be 'approved' or 'rejected'");
    }

    const club = await resolveLeadClub(leadId);

    const request = await membershipReqRepo().findOne({ where: { id: Number(requestId) } });
    if (!request)                    throw new NotFoundError("Membership request not found");
    if (request.clubId !== club.id)  throw new ForbiddenError("This request is not for your club");
    if (request.status !== "pending") throw new ValidationError("Request is no longer pending");

    await membershipReqRepo().update(Number(requestId), {
        status:     decision,
        reviewedBy: leadId,
        reviewedAt: new Date(),
    });

    if (decision === "approved") {
        const existing = await clubMemberRepo().findOne({ where: { userId: request.studentId } });
        if (!existing) {
            await clubMemberRepo().save(clubMemberRepo().create({
                userId: request.studentId,
                clubId: club.id,
            }));
        }
        const student = await userRepo().findOne({ where: { id: request.studentId } });
        if (student?.role === "student") {
            await userRepo().update(request.studentId, { role: "member" });
        }
    }

    return { message: `Membership request ${decision}` };
};

export const removeMember = async (leadId, userId) => {
    const club = await resolveLeadClub(leadId);

    const member = await clubMemberRepo().findOne({ where: { userId, clubId: club.id } });
    if (!member) throw new NotFoundError("Member not found in your club");

    await clubMemberRepo().delete({ userId, clubId: club.id });
    return { message: "Member removed from club" };
};
