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
            type: "varchar",
            nullable: true,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
