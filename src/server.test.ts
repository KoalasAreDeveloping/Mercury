import * as http2 from 'node:http2'
import * as fs from 'node:fs'

// @ts-ignore Reason: presumably it will exist wwhen this is ran. 
import * as Mercury from "./Mercury.js"

const config = {
    "port": 8000,
    "host": "localhost"
}

const server = new Mercury.MercuryServer({dev: true})

class routes {

    @server.router.route("/tests/post/")
    public PostTest(ctx) {

        console.log("PostTest called!")
        let response = new Mercury.ResponseConstructor()
        response.setCookies({ "test": "Hello World!" })
        response.addHeaders({"Content-Type": "text/html"})
        response.serveFile(ctx.res, "./test.html")

    }

}

server.run(config)
console.log("Started server")

const client = http2.connect(`https://${config.host}:${config.port}/`, { ca: fs.readFileSync('localhost-cert.pem'), rejectUnauthorized: false })

// Test POST request
let req = client.request({
    ":path": "/tests/post/"
})

req.on("response", (h, f) => {
    console.log(h)
    console.log(f)
})
req.end()

req = client.request({
    ":path": "/tests/post"
})

req.on("response", (h, f) => {
    console.log(h)
    console.log(f)
})
req.end()

// Test error handling
req = client.request({
    ":path": "/tests/"
})
req.on("response", (h, f) => {
    console.log(h)
    console.log(f)
})
req.end()