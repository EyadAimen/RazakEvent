import appDataSource from "../../config/dbConfig.mjs";
import { ClubEntity } from "./clubs.entity.mjs";
import { ClubRequestEntity } from "./club_requests.entity.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { In } from "typeorm";
import { NotFoundError, ConflictError, ValidationError } from "../shared/errors.mjs";

const clubRepo = () => appDataSource.getRepository(ClubEntity);
const clubRequestRepo = () => appDataSource.getRepository(ClubRequestEntity);
const userRepo = () => appDataSource.getRepository(UserEntity);

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
