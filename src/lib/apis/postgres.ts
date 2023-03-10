// Postgres handles PostgresSQL databases used by Mercury and easily implemented in a Mercury environment.
import { MercuryServer } from "../mercuryServer.js"
import { routeHandlerCtx } from "../../types.js"

import * as pg from "pg"
import * as pgtools from "pgtools"

export class PostgresAPI {

    server: MercuryServer
    config: pg.ConnectionConfig
    pool: pg.Pool
    commands: Object

    constructor(server: MercuryServer, config: pg.ConnectionConfig) { 
        this.server = server
        this.config = config

        if (this.server.MonitorAPI === undefined) {
            throw new Error("Postgres requires MonitorAPI to be defined")
        }

        // Create database
        pgtools.createdb(this.config, this.config.database).then()

        this.pool = new pg.Pool(this.config)
    }

    public newTable(tableName: string, schema: string): void { 
        this.pool.query("CREATE TABLE $1 ($2)", [tableName, schema])
    }

}