// typeorm configuration to connect to the db

import { DataSource } from "typeorm";
import configVars from "./envConfig.mjs";
import { UserEntity } from "../src/users/users.entity.mjs";

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
    entities: [UserEntity]
});

export default appDataSource;