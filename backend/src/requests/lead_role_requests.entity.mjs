import { EntitySchema } from "typeorm";

export const LeadRoleRequestEntity = new EntitySchema({
    name: "LeadRoleRequest",
    tableName: "lead_role_requests",
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
        adminId: {
            name: "admin_id",
            type: "uuid",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["pending", "approved", "rejected"],
            nullable: false,
        },
        adminComment: {
            name: "admin_comment",
            type: "text",
            nullable: true,
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
            name: "UQ_lead_role_requests_student_pending",
            columns: ["studentId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
