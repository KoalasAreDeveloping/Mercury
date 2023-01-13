import * as http2 from 'node:http2'
import * as fs from 'node:fs'

// @ts-ignore Reason: presumably it will exist wwhen this is ran. 
import * as Mercury from "./Mercury.js"

const config = {
    "port": 8000,
    "host": "localhost"
}

const server = new Mercury.MercuryServer({dev: true})
const router2 = new Mercury.Router()
class routes {

    @server.router.route("/tests/post/")
    public PostTest(ctx) {

        let response = new Mercury.ResponseConstructor()
        response.setCookies({ "test": "Hello World!" })
        response.addHeaders({"Content-Type": "text/html"})
        response.serveFile(ctx.res, "./test.html")

    }

    @router2.route("/tests/post/")
    public MergePostTest(ctx) {

        let response = new Mercury.ResponseConstructor()
        response.setCookies({ "test": "Hello World!" })
        response.addHeaders({"Content-Type": "text/html"})
        response.serveFile(ctx.res, "./test.html")

    }
}

server.router.merge(router2, "/merged")
server.run(config)
console.log("Started server")

const client = http2.connect(`https://${config.host}:${config.port}/`, { ca: fs.readFileSync('localhost-cert.pem'), rejectUnauthorized: false })

// Test POST request
var start = new Date().getTime()
var req = client.request({
    ":path": "/tests/post/"
})

req.on("response", (h, f) => {
    console.log(`Response time: ${new Date().getTime() - start}ms`)
    console.log("/tests/post/")
    console.log(h)
    console.log(f)
    console.log("\n\n")
})
req.end()

req = client.request({
    ":path": "/merged/tests/post/"
})
req.on("response", (h, f) => {
    console.log(`Response time: ${new Date().getTime() - start}ms`)
    console.log("/merged/tests/post/")
    console.log(h)
    console.log(f)
    console.log("\n\n")
})
req.end()

// Test error handling
req = client.request({
    ":path": "/tests/"
})
req.on("response", (h, f) => {
    console.log(`Response time: ${new Date().getTime() - start}ms`)
    console.log("/tests/")
    console.log(h)
    console.log(f)
    console.log("\n\n")
})

req.end()