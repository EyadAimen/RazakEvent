import { EntitySchema } from "typeorm";

export const EventProposalEntity = new EntitySchema({
    name: "EventProposal",
    tableName: "event_proposals",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        leadId: {
            type: "varchar",
            nullable: false,
        },
        clubId: {
            type: "int",
            nullable: false,
        },
        adminId: {
            type: "varchar",
            nullable: true,
        },
        venueId: {
            type: "int",
            nullable: true,
        },
        eventName: {
            type: "varchar",
            nullable: false,
        },
        proposedDate: {
            type: "timestamp",
            nullable: true,
        },
        description: {
            type: "text",
            nullable: true,
        },
        estimatedBudget: {
            type: "decimal",
            nullable: true,
        },
        proposalPdfUrl: {
            type: "varchar",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["draft", "pending", "approved", "rejected"],
            nullable: false,
        },
        adminComment: {
            type: "text",
            nullable: true,
        },
        submittedAt: {
            type: "timestamptz",
            nullable: true,
        },
        reviewedAt: {
            type: "timestamptz",
            nullable: true,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
