import appDataSource from "../../config/dbConfig.mjs";
import { LeadRoleRequestEntity } from "./lead_role_requests.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { ClubMemberEntity } from "../clubs/club_members.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { In } from "typeorm";
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from "../shared/errors.mjs";

const requestRepo = () => appDataSource.getRepository(LeadRoleRequestEntity);
const clubRepo = () => appDataSource.getRepository(ClubEntity);
const clubMemberRepo = () => appDataSource.getRepository(ClubMemberEntity);
const userRepo = () => appDataSource.getRepository(UserEntity);

const VALID_STATUSES = ["pending_lead", "pending_admin", "approved", "rejected"];

export const submitLeadRoleRequest = async (studentId, clubId) => {
    const club = await clubRepo().findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundError("Club not found");

    const membership = await clubMemberRepo().findOne({ where: { userId: studentId, clubId } });
    if (!membership) throw new ForbiddenError("You are not a member of this club");

    const existing = await requestRepo().findOne({
        where: { studentId, status: In(["pending_lead", "pending_admin"]) },
    });
    if (existing) throw new ConflictError("You already have a pending lead role request");

    const request = requestRepo().create({
        studentId,
        clubId,
        currentLeadId: club.leadId || null,
        status: club.leadId ? "pending_lead" : "pending_admin",
    });
    const saved = await requestRepo().save(request);

    return { requestId: saved.id };
};

export const getMyRequest = async (studentId) => {
    const request = await requestRepo().findOne({
        where: { studentId },
        order: { submittedAt: "DESC" },
    });
    if (!request) return { request: null };

    return {
        request: {
            id: request.id,
            clubId: request.clubId,
            status: request.status,
            leadComment: request.leadComment,
            adminComment: request.adminComment,
            submittedAt: request.submittedAt,
            leadReviewedAt: request.leadReviewedAt,
            reviewedAt: request.reviewedAt,
        },
    };
};

export const getIncomingRequests = async (leadId, statusFilter) => {
    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("No club found for this lead");

    const where = { clubId: club.id };
    if (!statusFilter || statusFilter === "pending_lead") {
        where.status = "pending_lead";
    } else if (statusFilter !== "all") {
        throw new ValidationError("status must be 'pending_lead' or 'all'");
    }

    const requests = await requestRepo().find({ where, order: { submittedAt: "DESC" } });
    if (requests.length === 0) return { requests: [] };

    const studentIds = requests.map(r => r.studentId);
    const students = await userRepo().find({ where: { id: In(studentIds) } });
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    return {
        requests: requests.map(r => ({
            id: r.id,
            status: r.status,
            submittedAt: r.submittedAt,
            student: studentMap[r.studentId]
                ? {
                      id: studentMap[r.studentId].id,
                      fullName: studentMap[r.studentId].fullName,
                      staffOrMatricId: studentMap[r.studentId].staffOrMatricId,
                  }
                : null,
        })),
    };
};

export const listLeadRoleRequests = async ({ status, search }) => {
    if (status && status !== "all" && !VALID_STATUSES.includes(status)) {
        throw new ValidationError("Invalid status value");
    }

    const where = {};
    if (status && status !== "all") where.status = status;

    const requests = await requestRepo().find({ where, order: { submittedAt: "DESC" } });
    if (requests.length === 0) return [];

    const studentIds = [...new Set(requests.map(r => r.studentId))];
    const clubIds = [...new Set(requests.map(r => r.clubId))];

    const [students, clubs] = await Promise.all([
        userRepo().find({ where: { id: In(studentIds) } }),
        clubRepo().find({ where: { id: In(clubIds) } }),
    ]);

    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
    const clubMap = Object.fromEntries(clubs.map(c => [c.id, c]));

    let result = requests.map(r => ({
        id: r.id,
        status: r.status,
        submittedAt: r.submittedAt,
        club: clubMap[r.clubId] ? { id: clubMap[r.clubId].id, name: clubMap[r.clubId].name } : null,
        student: studentMap[r.studentId]
            ? {
                  id: studentMap[r.studentId].id,
                  fullName: studentMap[r.studentId].fullName,
                  staffOrMatricId: studentMap[r.studentId].staffOrMatricId,
              }
            : null,
    }));

    if (search) {
        const term = search.toLowerCase();
        result = result.filter(
            r =>
                r.club?.name?.toLowerCase().includes(term) ||
                r.student?.fullName?.toLowerCase().includes(term)
        );
    }

    return result;
};

export const getLeadRoleRequest = async (requestId) => {
    const request = await requestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Lead role request not found");

    const [student, club] = await Promise.all([
        userRepo().findOne({ where: { id: request.studentId } }),
        clubRepo().findOne({ where: { id: request.clubId } }),
    ]);

    let currentLead = null;
    if (request.currentLeadId) {
        const leadUser = await userRepo().findOne({ where: { id: request.currentLeadId } });
        currentLead = leadUser ? { id: leadUser.id, fullName: leadUser.fullName } : null;
    }

    return {
        request: {
            id: request.id,
            status: request.status,
            leadComment: request.leadComment,
            adminComment: request.adminComment,
            submittedAt: request.submittedAt,
            leadReviewedAt: request.leadReviewedAt,
            reviewedAt: request.reviewedAt,
            club: club ? { id: club.id, name: club.name } : null,
            student: student
                ? {
                      id: student.id,
                      fullName: student.fullName,
                      staffOrMatricId: student.staffOrMatricId,
                      email: student.email,
                  }
                : null,
            currentLead,
        },
    };
};

export const decideLeadDecision = async (requestId, leadId, action, comment) => {
    if (!action || !["approved", "rejected"].includes(action)) {
        throw new ValidationError("action must be 'approved' or 'rejected'");
    }

    const request = await requestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Lead role request not found");

    if (request.status !== "pending_lead") {
        throw new ConflictError("This request is not awaiting lead review");
    }

    if (request.currentLeadId !== leadId) {
        throw new ForbiddenError("You are not the lead of this club");
    }

    if (action === "rejected" && (!comment || !comment.trim())) {
        throw new ValidationError("comment is required when rejecting a request");
    }

    const updateData = {
        status: action === "approved" ? "pending_admin" : "rejected",
        leadReviewedAt: new Date(),
    };
    if (comment?.trim()) updateData.leadComment = comment.trim();

    await requestRepo().update(parseInt(requestId), updateData);

    return { message: action === "approved" ? "Request approved" : "Request rejected" };
};

export const decideAdminDecision = async (requestId, adminId, action, adminComment) => {
    if (!action || !["approved", "rejected"].includes(action)) {
        throw new ValidationError("action must be 'approved' or 'rejected'");
    }

    const request = await requestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Lead role request not found");

    if (request.status !== "pending_admin") {
        throw new ConflictError("This request is not awaiting admin review");
    }

    if (action === "rejected") {
        if (!adminComment || !adminComment.trim()) {
            throw new ValidationError("adminComment is required when rejecting a request");
        }
        await requestRepo().update(parseInt(requestId), {
            status: "rejected",
            adminId,
            adminComment: adminComment.trim(),
            reviewedAt: new Date(),
        });
        return { message: "Request rejected" };
    }

    // action === "approved" — all side effects run in one transaction
    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        if (request.currentLeadId) {
            await queryRunner.manager.update("User", { id: request.currentLeadId }, { role: "member" });
            await queryRunner.manager.insert("ClubMember", {
                userId: request.currentLeadId,
                clubId: request.clubId,
            });
        }

        await queryRunner.manager.delete("ClubMember", { userId: request.studentId });
        await queryRunner.manager.update("User", { id: request.studentId }, { role: "lead" });
        await queryRunner.manager.update("Club", { id: request.clubId }, { leadId: request.studentId });

        const updateData = {
            status: "approved",
            adminId,
            reviewedAt: new Date(),
        };
        if (adminComment?.trim()) updateData.adminComment = adminComment.trim();
        await queryRunner.manager.update("LeadRoleRequest", { id: parseInt(requestId) }, updateData);

        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }

    return { message: "Request approved" };
};
