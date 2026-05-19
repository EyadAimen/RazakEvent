import { EntitySchema } from "typeorm";

export const VolunteeringApplicationEntity = new EntitySchema({
    name: "VolunteeringApplication",
    tableName: "volunteering_applications",
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
        roleId: {
            name: "role_id",
            type: "int",
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
    },
    indices: [
        {
            name: "UQ_vol_applications_student_role",
            columns: ["studentId", "roleId"],
            unique: true,
        },
    ],
});
