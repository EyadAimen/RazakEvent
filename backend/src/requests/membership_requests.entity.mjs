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
            type: "varchar",
            nullable: false,
        },
        clubId: {
            type: "int",
            nullable: false,
        },
        reviewedBy: {
            type: "varchar",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["pending", "approved", "rejected"],
            nullable: false,
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
    // One pending membership request per student per club at a time (DB_DESIGN §3.14)
    indices: [
        {
            name: "UQ_membership_requests_student_club_pending",
            columns: ["studentId", "clubId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
