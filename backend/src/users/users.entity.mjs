import { EntitySchema } from "typeorm";

export const UserEntity = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        fullName: {
            name: "full_name",
            type: "varchar",
            nullable: false,
        },
        staffOrMatricId: {
            name: "staff_or_matric_id",
            type: "varchar",
            nullable: true,
            unique: true,
        },
        email: {
            type: "varchar",
            unique: true,
            nullable: false,
        },
        passwordHash: {
            name: "password_hash",
            type: "varchar",
            nullable: false,
        },
        role: {
            type: "enum",
            enum: ["student", "member", "lead", "admin"],
            nullable: false,
        },
        profilePhotoUrl: {
            name: "profile_photo_url",
            type: "varchar",
            nullable: true,
        },
        // Auth fields — not in DB design doc but required for JWT refresh flow
        refreshTokenHash: {
            name: "refresh_token_hash",
            type: "varchar",
            nullable: true,
        },
        refreshTokenExpiry: {
            name: "refresh_token_expiry",
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
