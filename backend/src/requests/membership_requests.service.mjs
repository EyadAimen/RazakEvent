import appDataSource from "../../config/dbConfig.mjs";
import { MembershipRequestEntity } from "./membership_requests.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { ClubMemberEntity } from "../clubs/club_members.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { In } from "typeorm";
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from "../shared/errors.mjs";

const requestRepo = () => appDataSource.getRepository(MembershipRequestEntity);
const clubRepo = () => appDataSource.getRepository(ClubEntity);
const clubMemberRepo = () => appDataSource.getRepository(ClubMemberEntity);
const userRepo = () => appDataSource.getRepository(UserEntity);

export const submitMembershipRequest = async (studentId, clubId) => {
    const club = await clubRepo().findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundError("Club not found");

    const alreadyMember = await clubMemberRepo().findOne({ where: { userId: studentId, clubId } });
    if (alreadyMember) throw new ConflictError("You are already a member of this club");

    const existingPending = await requestRepo().findOne({ where: { studentId, clubId, status: "pending" } });
    if (existingPending) throw new ConflictError("You already have a pending request for this club");

    const request = requestRepo().create({ studentId, clubId, status: "pending" });
    const saved = await requestRepo().save(request);

    return { requestId: saved.id };
};

export const getMyRequests = async (studentId) => {
    const requests = await requestRepo().find({
        where: { studentId },
        order: { submittedAt: "DESC" },
    });
    if (requests.length === 0) return { requests: [] };

    const clubIds = [...new Set(requests.map(r => r.clubId))];
    const clubs = await clubRepo().find({ where: { id: In(clubIds) } });
    const clubMap = Object.fromEntries(clubs.map(c => [c.id, c]));

    return {
        requests: requests.map(r => ({
            id: r.id,
            clubId: r.clubId,
            clubName: clubMap[r.clubId]?.name ?? null,
            status: r.status,
            leadComment: r.leadComment,
            submittedAt: r.submittedAt,
            reviewedAt: r.reviewedAt,
        })),
    };
};

export const getIncomingRequests = async (leadId, statusFilter) => {
    if (statusFilter && statusFilter !== "all" && statusFilter !== "pending") {
        throw new ValidationError("status must be 'pending' or 'all'");
    }

    const club = await clubRepo().findOne({ where: { leadId } });
    if (!club) throw new NotFoundError("No club found for this lead");

    const where = { clubId: club.id };
    if (!statusFilter || statusFilter === "pending") where.status = "pending";

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

export const decideMembership = async (requestId, leadId, action, leadComment) => {
    if (!action || !["approved", "rejected"].includes(action)) {
        throw new ValidationError("action must be 'approved' or 'rejected'");
    }

    const request = await requestRepo().findOne({ where: { id: parseInt(requestId) } });
    if (!request) throw new NotFoundError("Membership request not found");

    if (request.status !== "pending") {
        throw new ConflictError("This request has already been reviewed");
    }

    const club = await clubRepo().findOne({ where: { id: request.clubId } });
    if (!club || club.leadId !== leadId) {
        throw new ForbiddenError("You are not the lead of this club");
    }

    if (action === "rejected") {
        if (!leadComment || !leadComment.trim()) {
            throw new ValidationError("leadComment is required when rejecting a request");
        }
        await requestRepo().update(parseInt(requestId), {
            status: "rejected",
            reviewedBy: leadId,
            leadComment: leadComment.trim(),
            reviewedAt: new Date(),
        });
        return { message: "Membership request rejected" };
    }

    // action === "approved" — must be atomic
    const queryRunner = appDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(UserEntity, { id: request.studentId }, { role: "member" });
        await queryRunner.manager.insert(ClubMemberEntity, {
            userId: request.studentId,
            clubId: request.clubId,
        });
        await queryRunner.manager.update(MembershipRequestEntity, { id: parseInt(requestId) }, {
            status: "approved",
            reviewedBy: leadId,
            reviewedAt: new Date(),
        });
        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }

    return { message: "Membership request approved" };
};
