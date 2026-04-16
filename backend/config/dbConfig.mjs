// typeorm configuration to connect to the db

import { DataSource } from "typeorm";
import configVars from "./config.mjs";




const appDataSource = new DataSource({
    type: "mysql",
    host: configVars.host,
    port: configVars.dbPort,
    username: configVars.username,
    password: configVars.password,
    database: configVars.database,

    // to automatically create the schema
    // run it once
    // synchronize: true,
    // all the tables must be listed here
    entities: []
});

export default appDataSource;