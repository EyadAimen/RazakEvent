import { EntitySchema } from "typeorm";

export const CertificateEntity = new EntitySchema({
    name: "Certificate",
    tableName: "certificates",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        userId: {
            type: "varchar",
            nullable: false,
        },
        eventId: {
            type: "int",
            nullable: false,
        },
        type: {
            type: "enum",
            enum: ["organizer", "volunteer"],
            nullable: false,
        },
        issuedAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
    // No duplicate certificates per user per event per type (DB_DESIGN §3.9)
    uniques: [
        {
            name: "UQ_certificates_user_event_type",
            columns: ["userId", "eventId", "type"],
        },
    ],
});
