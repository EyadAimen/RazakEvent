import { EntitySchema } from "typeorm";

export const ReportEntity = new EntitySchema({
    name: "Report",
    tableName: "reports",
    columns: {
        id: {
            type: "varchar",
            primary: true,
            generated: "uuid",
        },
        eventId: {
            type: "varchar",
            length: 36,
            nullable: false,
        },
        // "event" = post-event activity report, "money" = financial report
        type: {
            type: "enum",
            enum: ["event", "money"],
            nullable: false,
        },
        // "not_submitted" | "submitted" | "accepted"
        status: {
            type: "enum",
            enum: ["not_submitted", "submitted", "accepted"],
            default: "not_submitted",
        },
        pdfPath: {
            type: "varchar",
            length: 500,
            nullable: true,
        },
        submittedAt: {
            type: "timestamp",
            nullable: true,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
    },
});
