import * as http2 from "node:http2"
import * as url from "node:url"

export interface routeHandlerCtx {

    req: http2.Http2ServerRequest,
    res: http2.Http2ServerResponse,
    url: url.URL

}

export interface errorHandlerCtx {

    req: http2.Http2ServerRequest,
    res: http2.Http2ServerResponse,
    url: url.URL,
    code: number

}

export interface MercuryServerOptions extends http2.SecureServerOptions {
    
    staticPath?: string,
    dev?: boolean,

}

export interface runOptions {

    port?: number,
    host?: string,
    path?: string,
    backlog?: number,
    exclusive?: boolean,
    readableAll?: boolean,
    writableAll?: boolean,
    ipv6Only?: boolean,
    signal?: AbortSignal

}

export interface eventObject {

    eventName: string,
    event: string,
    eventDuration: number,
    timestamp: number,
    [key: string]: any

}