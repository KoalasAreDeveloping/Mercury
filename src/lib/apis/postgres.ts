// Postgres handles PostgresSQL databases used by Mercury and easily implemented in a Mercury environment.
import { MercuryServer } from "../mercuryServer.js"
import { ResponseConstructor } from "../responseConstructor.js"

import { routeHandlerCtx } from "../../types.js"

import * as pg from "pg"
import * as pgtools from "pgtools"

export class PostgresAPI {

    server: MercuryServer
    config: pg.ConnectionConfig
    pool: pg.Pool
    APIQueries: Object

    constructor(server: MercuryServer, config: pg.ConnectionConfig) { 
        this.server = server
        this.config = config

        if (this.server.MonitorAPI === undefined) {
            throw new Error("Postgres requires MonitorAPI to be defined")
        }

        // Create database
        try {
            pgtools.createdb(this.config, this.config.database).then()

        } catch (err) { 
            this.server.MonitorAPI.logEvent({
                eventName: "Postgres API Warning",
                event: err,
                eventDuration: 0,
                timestamp: this.server.MonitorAPI.now(),
                type: "warning"
            })
        }

        this.pool = new pg.Pool(this.config)

        function queryFn(ctx: routeHandlerCtx) { 
            
            let queryJSON: string
            let queryObj: {
                args: Array<string>,
                queryID: string,
                [key: string]: any
            }

            let response = new ResponseConstructor(this.server)

            // Get chunked data and add to the string
            ctx.req.on("data", (data) => {
                queryJSON += data.toString()
            })

            // log event at the end of the request
            ctx.req.on("end", () => {
                try {

                    queryObj = JSON.parse(queryJSON)

                } catch (err) {
                    this.server.MonitorAPI.logEvent({
                        eventName: "Postgres API Invalid Response",
                        event: err,
                        eventDuration: 0,
                        timestamp: this.server.MonitorAPI.now(),
                        type: "invalid"
                    })

                    response.serve(ctx, "Bad Request", 400)
                    throw err
                }

                try {

                    return this.pool.query(this.APIQueries[queryObj.queryID], queryObj.args)
                    
                } catch (err) {
                    this.server.MonitorAPI.logEvent({
                        eventName: "Postgres API Error",
                        event: err,
                        eventDuration: 0,
                        timestamp: this.server.MonitorAPI.now(),
                        type: "error"
                    })

                    response.serve(ctx, "Internal Error", 500)
                    throw err 
                }
            })
        }

        this.server.router.routeFn("/mercury/api/postgres/query/", "POST", (ctx: routeHandlerCtx) => {
            try {
                queryFn(ctx)
                let response = new ResponseConstructor(this.server)
                response.serve(ctx, "OK", 200)
            } catch (err) {}
        })

        this.server.router.routeFn("/mercury/api/postgres/query/", "GET", (ctx: routeHandlerCtx) => {
            try {
                let qRes = queryFn(ctx)
                let response = new ResponseConstructor(this.server)
                response.serve(ctx, JSON.stringify({ queryResponse: qRes }), 200)
            } catch (err) {}
        })
    }

    public newTable(tableName: string, schema: string): void { 
        this.pool.query("CREATE TABLE $1 ($2)", [tableName, schema])
    }

    // For security the public facing API uses the Pool.query with an argument array
    // Preset queries are accessed through query IDs, these can be some from of GUID or an accessable name
    public addAPIQuery(queryID: string, query: string): void { 
        this.APIQueries[queryID] = query
    }

}