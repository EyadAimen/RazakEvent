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
            name: "student_id",
            type: "uuid",
            nullable: false,
        },
        adminId: {
            name: "admin_id",
            type: "uuid",
            nullable: true,
        },
        resultClubId: {
            name: "result_club_id",
            type: "int",
            nullable: true,
        },
        clubName: {
            name: "club_name",
            type: "varchar",
            nullable: false,
        },
        clubType: {
            name: "club_type",
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
            name: "UQ_club_requests_student_pending",
            columns: ["studentId"],
            unique: true,
            where: "status = 'pending'",
        },
    ],
});
