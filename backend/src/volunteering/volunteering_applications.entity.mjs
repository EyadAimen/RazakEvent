import { EntitySchema } from "typeorm";

export const VolunteeringApplicationEntity = new EntitySchema({
    name: "VolunteeringApplication",
    tableName: "volunteering_applications",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        studentId: {
            name: "student_id",
            type: "uuid",
            nullable: false,
        },
        roleId: {
            name: "role_id",
            type: "uuid",
            nullable: false,
        },
        eventId: {
            name: "event_id",
            type: "uuid",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
            nullable: false,
        },
        appliedAt: {
            name: "applied_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            name: "reviewed_at",
            type: "timestamptz",
            nullable: true,
        },
        reason: {
            type: "text",
            nullable: true,
        },
        rejectionMessage: {
            name: "rejection_message",
            type: "text",
            nullable: true,
        },
    },
    indices: [
        {
            name: "UQ_vol_applications_student_role",
            columns: ["studentId", "roleId"],
            unique: true,
        },
        {
            name: "UQ_vol_applications_student_event",
            columns: ["studentId", "eventId"],
            unique: true,
        },
    ],
});
