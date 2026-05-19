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
            name: "event_id",
            type: "int",
            nullable: false,
        },
        roleName: {
            name: "role_name",
            type: "varchar",
            nullable: false,
        },
        description: {
            type: "text",
            nullable: true,
        },
        slotsAvailable: {
            name: "slots_available",
            type: "int",
            nullable: false,
        },
        slotsFilled: {
            name: "slots_filled",
            type: "int",
            nullable: false,
            default: 0,
        },
        createdAt: {
            name: "created_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
