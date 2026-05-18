import { EntitySchema } from "typeorm";

export const MoneyReportEntity = new EntitySchema({
    name: "MoneyReport",
    tableName: "money_reports",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        eventId: {
            name: "event_id",
            type: "int",
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
            type: "int",
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
        amountSpent: {
            name: "amount_spent",
            type: "decimal",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ["submitted", "reviewed"],
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
