import * as url from "node:url"


export class Router {

    handlers: Object
    errorCodes: Object
    errorHandler: (ctx: errorHandlerCtx) => void

    constructor() {

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

    }
    
    // Routes requests to handlers.
    public routingListener(req, res): any {

        // Create URL object
        var urlObj = new url.URL(req.url, "https://" + req.headers.host)

        var route: string

        // Ensure route ends with a slash
        if (urlObj.pathname.slice(urlObj.pathname.length -1, urlObj.pathname.length) != "/") {
            route = urlObj.pathname + "/"
        } else {
            route = urlObj.pathname
        }

        try {
            // Pass request context object to route handler if avaliable
            return this.handlers[route]({ req: req, res: res, url: urlObj })
        } catch (e) {
            return this.errorHandler({ req: req, res: res, url: urlObj, code: 404 })
        }
    }
    
    public route(route: string) {

        // Ensure all routes end with a slash
        if (route.slice(route.length -1, route.length) != "/") {
            route = route + "/"
        }

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

    public merge(router: Router) {

        for (let key in Object.keys(router.handlers)) {
            if (key in this.handlers) {
                // Block conflicts
                delete router.handlers[key]
                console.log(`Conflict merging "${key}", prioritising parent router. Consider resolving this conflict or merging with a URL prefix using Router.prefixMerge to prevent routing issues.`)
            } else {
                // Add keys that don't conflict
                this.handlers[key] = router.handlers[key]
            }
        }

    }

    public prefixMerge(router: Router, urlPrefix: string) {

        for (let key in Object.keys(router.handlers)) {
            let prefixKey = urlPrefix + key
            if (prefixKey in this.handlers) {
                // Block conflicts
                delete router.handlers[key]
                console.log(`Conflict merging "${prefixKey}", prioritising parent router. Consider resolving this conflict to prevent routing issues.`)
            } else {
                // Add keys that don't conflict
                this.handlers[prefixKey] = router.handlers[key]
            }
        }

    }

}

// TYPES

import * as http2 from "node:http2"

export declare type routeHandlerCtx = {

    req: http2.Http2ServerRequest,
    res: http2.Http2ServerResponse,
    url: url.URL

}

export declare type errorHandlerCtx = {

    req: http2.Http2ServerRequest,
    res: http2.Http2ServerResponse,
    url: url.URL,
    code: number

}