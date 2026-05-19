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
            name: "proposal_id",
            type: "int",
            nullable: false,
        },
        clubId: {
            name: "club_id",
            type: "int",
            nullable: false,
        },
        venueId: {
            name: "venue_id",
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
            name: "event_date",
            type: "timestamp",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ["approved", "ongoing", "completed", "report_due"],
            nullable: false,
        },
        volunteeringStatus: {
            name: "volunteering_status",
            type: "enum",
            enum: ["closed", "open", "full"],
            default: "closed",
            nullable: false,
        },
        createdAt: {
            name: "created_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
