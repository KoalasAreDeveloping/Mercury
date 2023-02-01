import { MercuryServer } from "./mercuryServer.js"
import { ResponseConstructor } from "./responseConstructor.js"
import { prepareRoute } from "./utils.js"
import { errorHandlerCtx, routeHandlerCtx } from "../types.js"

import * as url from "node:url"
import * as http2 from "node:http2"

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
    
        this.serviceFiles = {
            "cookies": "cookies.js",
            "sauron": "sauron.js",
        }

        this.staticPath = staticPath || "static"

        this.server = server

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

            // Check if route is requesting a static file, which can be found in the static directory.
            if (route.split("/")[1] == "static") {

                // Send static file
                let response = new ResponseConstructor
                response.headers["content-type"] = req.headers["content-type"] || "*/*"
                // Ensure that static path is not escaped.
                if (urlObj.searchParams.get("file").indexOf("..") == -1) {
                    response.serveFile(ctx, `${this.staticPath}/${urlObj.searchParams.get("file")}`)
                } else { 
                    this.errorHandler({ ...ctx, code: 403 })
                }
                    
                // Check if route is requesting a builtin webpage/resource
            } else if (route.split("/")[1] == "mercury") {

                if (route.split("/")[2] == "services") {

                    let response = new ResponseConstructor
                    response.headers["content-type"] = "text/javascript"
                    route = route.split("/").splice(3).join("/")
                    if (this.serviceFiles[route.substring(0, route.length - 1)] != undefined) {
                        let file = this.serviceFiles[route.substring(0, route.length - 1)]
                        response.serveFile(ctx, `${__dirname}/services/${file}`)
                    } else {
                        throw new Error(`Service ${route.substring(0, route.length - 1)} does not exist.`)
                    }

                } else if (route.split("/")[2] == "assets") { 

                    let response = new ResponseConstructor

                    switch (route.split("/")[3]) {

                        case "css": {
                            response.headers["content-type"] = "text/css"
                            response.serveFile(ctx, `${__dirname}/assets/mercury.css`)
                        }

                    }

                }  else {
                    //TODO: create builtin route routing handler for APIs
                    this.errorHandler({ ...ctx, code: 501 })
                }

            } else {
                // Pass request context object to route handler if avaliable
                this.handlers[route](ctx)
            }

        } catch (e) {
            this.errorHandler({ ...ctx, code: 404 })
        }
    }
    
    public route(route: string) {

        // Prepare route
        route = prepareRoute(route)

        // Decorator
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => { 
            // Add to handlers
            if (descriptor.value != undefined) {
                this.handlers[route] = descriptor.value
            } else {
                throw new Error(`Error creating route handler for ${route}, handler (${target}.${propertyKey}) does have a value.`)
            }
        }

    }

    public routeFn(route: string, func: Function) {

        // Prepare route
        route = prepareRoute(route)

        // Add to handlers
        this.handlers[route] = func

    }

    public merge(router: Router, urlPrefix: string = "") {

        let keys = Object.keys(router.handlers)

        for (let key in keys) {

            let unprefixedKey = keys[key]
            key = urlPrefix + keys[key]

            if (this.handlers.hasOwnProperty(key)) {

                // Block conflicts
                delete router.handlers[key]

                if (urlPrefix == undefined) {
                    console.log(`Conflict merging "${key}", prioritising parent router. Consider resolving this conflict or merging with a URL prefix by passing the urlPrefix argument to prevent routing issues.`)
                } else {
                    console.log(`Conflict merging "${key}", prioritising parent router. Consider resolving this conflict to prevent routing issues.`)
                }

            } else {

                // Add keys that don't conflict
                this.handlers[key] = router.handlers[unprefixedKey]

            }
        }
    }

}