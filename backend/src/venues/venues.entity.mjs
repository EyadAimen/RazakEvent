import { EntitySchema } from "typeorm";

export const VenueEntity = new EntitySchema({
    name: "Venue",
    tableName: "venues",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        name: {
            type: "varchar",
            unique: true,
            nullable: false,
        },
        location: {
            type: "varchar",
            nullable: true,
        },
    },
});
