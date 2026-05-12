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
            type: "int",
            unique: true,
            nullable: false,
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
        reportPdfUrl: {
            type: "varchar",
            nullable: false,
        },
        amountSpent: {
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
            type: "text",
            nullable: true,
        },
        submittedAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
        reviewedAt: {
            type: "timestamptz",
            nullable: true,
        },
    },
});
