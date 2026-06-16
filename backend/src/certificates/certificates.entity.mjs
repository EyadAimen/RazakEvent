import { EntitySchema } from "typeorm";

export const CertificateEntity = new EntitySchema({
    name: "Certificate",
    tableName: "certificates",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        userId: {
            name: "user_id",
            type: "uuid",
            nullable: false,
        },
        eventId: {
            name: "event_id",
            type: "uuid",
            nullable: false,
        },
        type: {
            type: "enum",
            enum: ["organizer", "volunteer"],
            nullable: false,
        },
        issuedAt: {
            name: "issued_at",
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
    indices: [
        {
            name: "UQ_certificates_user_event_type",
            columns: ["userId", "eventId", "type"],
            unique: true,
        },
    ],
});
