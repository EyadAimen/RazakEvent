import { EntitySchema } from "typeorm";

export const ClubMemberEntity = new EntitySchema({
    name: "ClubMember",
    tableName: "club_members",
    columns: {
        userId: {
            type: "varchar",
            primary: true,
            nullable: false,
        },
        clubId: {
            type: "int",
            primary: true,
            nullable: false,
        },
        joinedAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
    // UNIQUE userId — a member can only belong to one club at a time (DB_DESIGN §3.8)
    indices: [
        {
            name: "UQ_club_members_user",
            columns: ["userId"],
            unique: true,
        },
    ],
});
