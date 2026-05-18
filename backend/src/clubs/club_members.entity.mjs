import { EntitySchema } from "typeorm";

export const ClubMemberEntity = new EntitySchema({
    name: "ClubMember",
    tableName: "club_members",
    columns: {
        userId: {
            name: "user_id",
            type: "uuid",
            nullable: false,
            primary: true,
        },
        clubId: {
            name: "club_id",
            type: "int",
            nullable: false,
            primary: true,
        },
        joinedAt: {
            name: "joined_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
    // A member can only belong to one club at a time
    indices: [
        {
            name: "UQ_club_members_user",
            columns: ["userId"],
            unique: true,
        },
    ],
});
