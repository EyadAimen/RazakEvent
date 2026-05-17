import { EntitySchema } from "typeorm";

export const ClubRequestEntity = new EntitySchema({
    name: "ClubRequest",
    tableName: "club_requests",
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
        adminId: {
            type: "varchar",
            nullable: true,
        },
        resultClubId: {
            type: "int",
            nullable: true,
        },
        clubName: {
            type: "varchar",
            nullable: false,
        },
        clubType: {
            type: "enum",
            enum: ["club", "community"],
            nullable: false,
        },
        description: {
            type: "text",
            nullable: false,
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
    // Partial unique: one pending club request per student at a time (DB_DESIGN §3.12)
    indices: [
        {
            name: "UQ_club_requests_student_pending",
            columns: ["studentId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
