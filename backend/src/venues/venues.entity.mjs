import { EntitySchema } from "typeorm";

export const VenueEntity = new EntitySchema({
    name: "Venue",
    tableName: "venues",
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
        location: {
            type: "varchar",
            nullable: true,
        },
    },
});
