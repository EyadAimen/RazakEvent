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
        name: {
            type: "varchar",
            length: 100,
        },
        email: {
            type: "varchar",
            length: 150,
            unique: true,
        },
        passwordHash: {
            type: "varchar",
            length: 255,
        },
        matricNumber: {
            type: "varchar",
            length: 9,
            nullable: true,
        },
        role: {
            type: "enum",
            enum: ["student", "member", "lead", "admin"],
        },
        clubId: {
            type: "varchar",
            length: 36,
            nullable: true,
        },
        isApproved: {
            type: "boolean",
            default: false,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
    },
});
