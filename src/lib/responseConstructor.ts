import { routeHandlerCtx } from "../types.js"

import * as http2 from "node:http2"
import * as fs from "node:fs"
import * as react from "react"
import * as reactDOMServer from "react-dom/server"

export class ResponseConstructor {

    headers: http2.OutgoingHttpHeaders

    constructor() {
        this.headers = {}
    }

    public setCookies(cookies: Object): void {
        
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