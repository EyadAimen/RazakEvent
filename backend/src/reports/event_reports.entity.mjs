import { EntitySchema } from "typeorm";

export const EventReportEntity = new EntitySchema({
    name: "EventReport",
    tableName: "event_reports",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        eventId: {
            name: "event_id",
            type: "uuid",
            unique: true,
            nullable: false,
        },
        leadId: {
            name: "lead_id",
            type: "uuid",
            nullable: false,
        },
        clubId: {
            name: "club_id",
            type: "uuid",
            nullable: false,
        },
        adminId: {
            name: "admin_id",
            type: "uuid",
            nullable: true,
        },
        reportPdfUrl: {
            name: "report_pdf_url",
            type: "varchar",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ["submitted", "accepted", "rejected"],
            default: "submitted",
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
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            name: "reviewed_at",
            type: "timestamptz",
            nullable: true,
        },
    },
});
