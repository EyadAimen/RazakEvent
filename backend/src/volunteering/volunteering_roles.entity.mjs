import { EntitySchema } from "typeorm";

export const VolunteeringRoleEntity = new EntitySchema({
    name: "VolunteeringRole",
    tableName: "volunteering_roles",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        eventId: {
            type: "int",
            nullable: false,
        },
        roleName: {
            type: "varchar",
            nullable: false,
        },
        description: {
            type: "text",
            nullable: true,
        },
        slotsAvailable: {
            type: "int",
            nullable: false,
        },
        slotsFilled: {
            type: "int",
            default: 0,
            nullable: false,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
