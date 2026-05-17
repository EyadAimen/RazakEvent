import { EntitySchema } from "typeorm";

export const UserEntity = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: "varchar",
            primary: true,
            generated: "uuid",
        },
        fullName: {
            type: "varchar",
            nullable: false,
        },
        staffOrMatricId: {
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
            type: "varchar",
            nullable: false,
        },
        role: {
            type: "enum",
            enum: ["student", "member", "lead", "admin"],
            nullable: false,
        },
        profilePhotoUrl: {
            type: "varchar",
            nullable: true,
        },
        refreshTokenHash: {
            type: "varchar",
            nullable: true,
        },
        refreshTokenExpiry: {
            type: "timestamptz",
            nullable: true,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            nullable: false,
        },
    },
});
