import * as http2 from "node:http2"
import * as fs from "node:fs"

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
    
    public serveFile(res: http2.Http2ServerResponse, fp: string): void {
        
        fs.readFile(fp, (err, data) => {

            if (err) { throw err }
            this.serve(res, data.toString())

        })

    }

    public serve(res: http2.Http2ServerResponse, data: string, code: number = 200): void {

        res.writeHead(code, this.headers)
        res.write(data)
        res.end()

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