// typeorm configuration to connect to the db

import { DataSource } from "typeorm";
import configVars from "./envConfig.mjs";
import { UserEntity } from "../src/users/users.entity.mjs";
import { ClubEntity } from "../src/clubs/clubs.entity.mjs";
import { EventEntity } from "../src/events/events.entity.mjs";
import { ReportEntity } from "../src/reports/reports.entity.mjs";

const appDataSource = new DataSource({
    type: "postgres",
    host: configVars.host,
    port: configVars.dbPort,
    username: configVars.dbUsername,
    password: configVars.dbPassword,
    database: configVars.database,

    // to automatically create the schema
    // run it once
    synchronize: true,
    // all the tables must be listed here
    entities: [UserEntity, ClubEntity, EventEntity, ReportEntity]
});

export default appDataSource;