import { EntitySchema } from "typeorm";

export const EventEntity = new EntitySchema({
    name: "Event",
    tableName: "events",
    columns: {
        id: {
            type: "varchar",
            primary: true,
            generated: "uuid",
        },
        name: {
            type: "varchar",
            length: 200,
        },
        clubId: {
            type: "varchar",
            length: 36,
            nullable: false,
        },
        leadId: {
            type: "varchar",
            length: 36,
            nullable: false,
        },
        // Proposed/actual event date
        eventDate: {
            type: "date",
            nullable: true,
        },
        venue: {
            type: "varchar",
            length: 200,
            nullable: true,
        },
        description: {
            type: "text",
            nullable: true,
        },
        estimatedBudget: {
            type: "decimal",
            precision: 10,
            scale: 2,
            nullable: true,
        },
        attendees: {
            type: "int",
            default: 0,
        },
        // draft | submitted | approved | rejected | completed | report_due
        status: {
            type: "enum",
            enum: ["draft", "submitted", "approved", "rejected", "completed", "report_due"],
            default: "draft",
        },
        // PDF path for the proposal document
        pdfPath: {
            type: "varchar",
            length: 500,
            nullable: true,
        },
        // Admin feedback on rejection or approval
        adminComment: {
            type: "text",
            nullable: true,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
    },
});
