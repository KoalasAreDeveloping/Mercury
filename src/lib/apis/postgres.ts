// Postgres handles PostgresSQL databases used by Mercury and easily implemented in a Mercury environment.
import { MercuryServer } from "../mercuryServer.js"
import { routeHandlerCtx } from "../../types.js"


export class PostgresAPI {

    server: MercuryServer

    constructor(server: MercuryServer) { 
        this.server = server
    }
}