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
            type: "varchar",
            nullable: false,
        },
        clubId: {
            type: "int",
            nullable: false,
        },
        adminId: {
            type: "varchar",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["pending", "approved", "rejected"],
            nullable: false,
        },
        adminComment: {
            type: "text",
            nullable: true,
        },
        submittedAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            type: "timestamptz",
            nullable: true,
        },
    },
    // One pending lead role request per student at a time (DB_DESIGN §3.13)
    indices: [
        {
            name: "UQ_lead_role_requests_student_pending",
            columns: ["studentId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
