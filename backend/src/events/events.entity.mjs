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
        completedAt: {
            name: "completed_at",
            type: "timestamptz",
            nullable: true,
        },
        reportDueAt: {
            name: "report_due_at",
            type: "timestamptz",
            nullable: true,
        },
        reportPdfUrl: {
            name: "report_pdf_url",
            type: "varchar",
            nullable: true,
        },
        reportStatus: {
            name: "report_status",
            type: "varchar",
            default: "not_submitted",
            nullable: false,
        },
        reportAdminComment: {
            name: "report_admin_comment",
            type: "text",
            nullable: true,
        },
        reportSubmittedAt: {
            name: "report_submitted_at",
            type: "timestamptz",
            nullable: true,
        },
        reportReviewedAt: {
            name: "report_reviewed_at",
            type: "timestamptz",
            nullable: true,
        },
        createdAt: {
            name: "created_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        completionReportPdfUrl: {
            name: "completion_report_pdf_url",
            type: "varchar",
            nullable: true,
        },
        financialReportPdfUrl: {
            name: "financial_report_pdf_url",
            type: "varchar",
            nullable: true,
        },
    },
});