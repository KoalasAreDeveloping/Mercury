import { routeHandlerCtx } from "../types.js"
import { MercuryServer } from "./mercuryServer.js"

import * as http2 from "node:http2"
import * as fs from "node:fs"
import * as react from "react"
import * as reactDOMServer from "react-dom/server"

export class ResponseConstructor {

    server: MercuryServer
    defaultHeaders: http2.OutgoingHttpHeaders
    headers: http2.OutgoingHttpHeaders

    constructor(server: MercuryServer, defaultHeaders: http2.OutgoingHttpHeaders = {}) {
        this.server = server
        
        if (defaultHeaders != undefined) {
            this.defaultHeaders = defaultHeaders
        } else {
            defaultHeaders = {
                "X-XSS-Protection": "1; mode=block",
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': "default-src 'self' /static https://*",
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN'
            }
        }
    }

    public setCookies(ctx: routeHandlerCtx, cookies: Object): void {
        
        let getCookiePolicy = () => {

            try {
                let name = 'allowCookies='
                let ca = ctx.req.headers.cookie.split(';')
        
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i]
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1)
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length)
                    }
                }

                return ''

            } catch {

                return ''

            }
        }

        if (Boolean(getCookiePolicy())) {
            // Get a list of keys and create an array to store cookies in.
            let keys = Object.keys(cookies)
            let cookieArray = []

            for (let key in keys) {

                // For loop makes key an index in the array, so the value we want is collected from the array.
                key = keys[key]
                // Add cookies to the array in the Set-Cookie header format
                cookieArray.push(`${key}=${cookies[key]}`)

            }

            // Set Set-Cookie header to the cookies created.
            this.headers['Set-Cookie'] = cookieArray
        } else {
            console.log(`Failure to add cookie (client does not accept cookies)`)
        }

    }

    public serveReact(ctx: routeHandlerCtx, node: react.ReactNode, code?: number, streamRes?: boolean): void {

        code = code ?? 200
        streamRes = streamRes ?? true
        let headers = this.headers

        const stream = reactDOMServer.renderToPipeableStream(
            node,
            {
                onShellReady() {
                    if (streamRes) {
                        ctx.res.writeHead(code, headers)
                        stream.pipe(ctx.res)
                    }
                },
                
                onShellError(error) {
                    console.log(error)
                },

                onAllReady() {
                    if (!streamRes) {
                        ctx.res.writeHead(code, headers)
                        stream.pipe(ctx.res)
                    }
                },

                onError(err) {
                    console.error(err)
                },
            }
        )

    }
    
    public serveFile(ctx: routeHandlerCtx, fp: string): void {
     
        fs.readFile(fp, (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    this.serve(ctx, "An error occurred.\n\n400: Bad Request\n  This asset requested does not exist.", 400)
                } else {
                    this.serve(ctx, "An error occurred.\n\n500: Internal Error\n  The server encountered an unexpected condition \
                    which prevented it from fulfilling the request.", 500)
                }
            } else {
                this.serve(ctx, data.toString())
            }
        })

    }

    public serve(ctx: routeHandlerCtx, data: string, code: number = 200): void {

        ctx.res.writeHead(code, this.headers)
        ctx.res.write(data)
        ctx.res.end()
    }

    public addHeaders(headers: http2.OutgoingHttpHeaders, prioritiseArg: boolean = false): void {

        // Change priority depending on if you would rather override the generated headers.
        if (prioritiseArg) {

            this.headers = { ...this.headers, ...headers }
            
        } else {

            this.headers = { ...headers, ...this.headers }

        }

    }

}
