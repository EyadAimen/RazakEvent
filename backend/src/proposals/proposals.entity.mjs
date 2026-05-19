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
            name: "lead_id",
            type: "uuid",
            nullable: false,
        },
        clubId: {
            name: "club_id",
            type: "int",
            nullable: false,
        },
        adminId: {
            name: "admin_id",
            type: "uuid",
            nullable: true,
        },
        venueId: {
            name: "venue_id",
            type: "int",
            nullable: true,
        },
        eventName: {
            name: "event_name",
            type: "varchar",
            nullable: false,
        },
        proposedDate: {
            name: "proposed_date",
            type: "timestamp",
            nullable: true,
        },
        description: {
            type: "text",
            nullable: true,
        },
        estimatedBudget: {
            name: "estimated_budget",
            type: "decimal",
            nullable: true,
        },
        proposalPdfUrl: {
            name: "proposal_pdf_url",
            type: "varchar",
            nullable: true,
        },
        status: {
            type: "enum",
            enum: ["draft", "pending", "approved", "rejected"],
            nullable: false,
        },
        adminComment: {
            name: "admin_comment",
            type: "text",
            nullable: true,
        },
        submittedAt: {
            name: "submitted_at",
            type: "timestamptz",
            nullable: true,
        },
        reviewedAt: {
            name: "reviewed_at",
            type: "timestamptz",
            nullable: true,
        },
        createdAt: {
            name: "created_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
