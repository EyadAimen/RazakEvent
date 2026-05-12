import { EntitySchema } from "typeorm";

export const EventEntity = new EntitySchema({
    name: "Event",
    tableName: "events",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        proposalId: {
            type: "int",
            nullable: false,
        },
        clubId: {
            type: "int",
            nullable: false,
        },
        venueId: {
            type: "int",
            nullable: false,
        },
        name: {
            type: "varchar",
            nullable: false,
        },
        description: {
            type: "text",
            nullable: false,
        },
        eventDate: {
            type: "timestamp",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ["approved", "ongoing", "completed", "report_due"],
            nullable: false,
        },
        volunteeringStatus: {
            type: "enum",
            enum: ["closed", "open", "full"],
            default: "closed",
            nullable: false,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
