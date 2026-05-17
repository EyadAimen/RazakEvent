import { EntitySchema } from "typeorm";

export const ClubEntity = new EntitySchema({
    name: "Club",
    tableName: "clubs",
    columns: {
        id: {
            type: "varchar",
            primary: true,
            generated: "uuid",
        },
        name: {
            type: "varchar",
            length: 150,
            unique: true,
        },
        type: {
            type: "enum",
            enum: ["club", "community"],
            default: "club",
        },
        leadId: {
            type: "varchar",
            length: 36,
            nullable: true,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
    },
});
