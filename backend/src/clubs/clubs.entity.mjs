import { EntitySchema } from "typeorm";

export const ClubEntity = new EntitySchema({
    name: "Club",
    tableName: "clubs",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        name: {
            type: "varchar",
            unique: true,
            nullable: false,
        },
        type: {
            type: "enum",
            enum: ["club", "community"],
            nullable: false,
        },
        description: {
            type: "text",
            nullable: false,
        },
        leadId: {
            name: "lead_id",
            type: "uuid",
            nullable: true,
        },
        createdAt: {
            name: "created_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        deletedAt: {
            name: "deleted_at",
            type: "timestamptz",
            nullable: true,
        },
        deleteReason: {
            name: "delete_reason",
            type: "text",
            nullable: true,
        },
        deletedBy: {
            name: "deleted_by",
            type: "uuid",
            nullable: true,
        },
    },
});
