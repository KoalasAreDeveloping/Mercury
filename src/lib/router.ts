import { MercuryServer } from "./mercuryServer.js"
import { ResponseConstructor } from "./responseConstructor.js"
import { prepareRoute } from "./utils.js"
import { errorHandlerCtx, routeHandlerCtx } from "../types.js"

import * as url from "node:url"
import * as http2 from "node:http2"
import lodash from "lodash"

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class Router {

    handlers: Object
    errorCodes: Object
    errorHandler: (ctx: errorHandlerCtx) => void
    serviceFiles: Object
    staticPath: string
    server: MercuryServer
    
    constructor(server: MercuryServer, staticPath?: string) {

        this.handlers = {}

        this.errorCodes = {
            400: {short: "Bad request", long: "The request had bad syntax or was inherently impossible to be satisfied."},
            401: {short: "Unauthorized", long: "The parameter to this message gives a specification of authorization schemes which are acceptable. The client should retry the request with a suitable Authorization header."},
            402: {short: "PaymentRequired", long: "The parameter to this message gives a specification of charging schemes acceptable. The client may retry the request with a suitable ChargeTo header."},
            403: {short: "Forbidden", long: "The request is for something forbidden. Authorization will not help."},
            404: {short: "Not found", long: "The server has not found anything matching the URI given."},
            500: {short: "Internal Error", long: "The server encountered an unexpected condition which prevented it from fulfilling the request."},
            501: {short: "Not implemented", long: "The server does not support the facility required."}
        }
                
        // Highly recommended to replace this with your own function
        this.errorHandler = (ctx: errorHandlerCtx) => {
            console.log(`${ctx.code} - URL: ${ctx.url}\n(${ctx.req.socket.remoteFamily}) ${ctx.req.socket.remoteAddress} on ${ctx.req.socket.remotePort}\n\n\n`)
            ctx.res.writeHead(ctx.code, {'Content-Type': 'text/plain'})
            ctx.res.write(`An error occurred.\n\n${ctx.code}: ${this.errorCodes[ctx.code].short}\n  ${this.errorCodes[ctx.code].long}`)
            ctx.res.end()
        }

        this.staticPath = staticPath || "static"

        this.server = server

        this.routeFn("/static/", "GET", (ctx: routeHandlerCtx) => {

            let response = new ResponseConstructor(this.server)

            response.headers["content-type"] = ctx.req.headers["content-type"] || "*/*"

            // Ensure that static path is not escaped.
            if (ctx.url.searchParams.get("file").indexOf("..") == -1) {
                response.serveFile(ctx, `${this.staticPath}/${ctx.url.searchParams.get("file")}`)
            } else { 
                this.errorHandler({ ...ctx, code: 403 })
            }
    
        })

        this.routeFn("/mercury/services/", "GET", (ctx: routeHandlerCtx) => {

            let response = new ResponseConstructor(this.server)
            response.headers["content-type"] = "text/javascript"

            // Ensure that service path is not escaped or traversed.
            if (ctx.url.searchParams.get("service").indexOf("/") == -1) {
                try {
                    response.serveFile(ctx, `${__dirname}/services/${ctx.url.searchParams.get("service")}.js`)
                } catch (e) {
                    this.errorHandler({ ...ctx, code: 404 })
                }
            } else { 
                this.errorHandler({ ...ctx, code: 403 })
            }
    
        })

        this.routeFn("/mercury/assets/css/", "GET", (ctx: routeHandlerCtx) => {

            let response = new ResponseConstructor(this.server)
            response.headers["content-type"] = "text/css"
            response.serveFile(ctx, `${__dirname}/assets/mercury.css`)

        })

    }


    // Routes requests to handlers.
    public routingListener(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse): any {

        // Create URL object
        var urlObj = new url.URL(req.url, "https://" + req.headers.host)

        // create context
        var ctx = { req: req, res: res, url: urlObj }

        // Ensure route ends with a slash
        var route = prepareRoute(urlObj.pathname)

        try {

            // Get handler using Lodash.
            let handler = lodash.get(this.handlers, route)

            // Call handler for method
            handler[req.method.toUpperCase()](ctx)

        } catch (e) {
            this.errorHandler({ ...ctx, code: 404 })
        }
    }
    
    public route(route: string, method: string) {

        // Prepare route
        let _route = prepareRoute(route)
        _route.push(method.toUpperCase())

        // Decorator
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => { 
            // Add to handlers
            if (descriptor.value != undefined) {
                // Set handler with Lodash.
                lodash.set(this.handlers, _route, descriptor.value)
            } else {
                throw new Error(`Error creating route handler for ${route}, handler (${target}.${propertyKey}) does have a value.`)
            }
        }

    }

    public routeFn(route: string, method: string, func: Function) {

        // Prepare route
        let _route = prepareRoute(route)
        _route.push(method.toUpperCase())

        // Set handler with Lodash.
        lodash.set(this.handlers, _route, func)

    }

    public merge(router: Router, urlPrefix?: string) {

        var _handlers = router.handlers[""]

        // Remove builtin routes
        _handlers = lodash.omit(_handlers, ["static", "mercury"])

        if (urlPrefix === undefined) {

            // Merge with Lodash, prioritising this other router.
            this.handlers = lodash.merge(_handlers, this.handlers)
            
        } else {
            // Add router.handlers to this.handlers under prefix
            this.handlers[""][urlPrefix] = _handlers

        }

    }

}