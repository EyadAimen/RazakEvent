import { EntitySchema } from "typeorm";

export const MembershipRequestEntity = new EntitySchema({
    name: "MembershipRequest",
    tableName: "membership_requests",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        studentId: {
            name: "student_id",
            type: "uuid",
            nullable: false,
        },
        clubId: {
            name: "club_id",
            type: "int",
            nullable: false,
        },
        reviewedBy: {
            name: "reviewed_by",
            type: "uuid",
            nullable: true,
        },
        leadComment: {
            name: "lead_comment",
            type: "text",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["pending", "approved", "rejected"],
            nullable: false,
        },
        submittedAt: {
            name: "submitted_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            name: "reviewed_at",
            type: "timestamptz",
            nullable: true,
        },
    },
    indices: [
        {
            name: "UQ_membership_requests_student_club_pending",
            columns: ["studentId", "clubId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
