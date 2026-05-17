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
            type: "varchar",
            nullable: false,
        },
        roleId: {
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
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            type: "timestamptz",
            nullable: true,
        },
    },
    // A student can only apply once per role (DB_DESIGN §3.7)
    uniques: [
        {
            name: "UQ_vol_applications_student_role",
            columns: ["studentId", "roleId"],
        },
    ],
});
