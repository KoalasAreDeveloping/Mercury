import * as http2 from "node:http2";
import * as fs from "node:fs";
import * as react from "react";
import { performance } from "node:perf_hooks";

import * as Mercury from "../index.js";
import { TestComponent } from "./testpage.js";

const config = {
  port: 8000,
  host: "localhost",
};

const server = new Mercury.MercuryServer({ dev: true, staticPath: "." });
const router2 = new Mercury.Router(server);
class routes {
  @server.router.route("/tests/get/")
  public getTest(ctx) {
    let response = new Mercury.ResponseConstructor();
    response.setCookies({ test: "Hello World!" });
    response.addHeaders({ "Content-Type": "text/html" });
    response.serveFile(ctx, "./dist/tests/assets/test.html");
  }

  @server.router.route("/tests/get/react/")
  public ReactTest(ctx) {
    let response = new Mercury.ResponseConstructor();
    response.setCookies({ test: "Hello World!" });
    response.addHeaders({ "Content-Type": "text/html" });
    response.serveReact(ctx, react.createElement(TestComponent));
  }

  @router2.route("/tests/get/")
  public MergeGetTest(ctx) {
    let response = new Mercury.ResponseConstructor();
    response.setCookies({ test: "Hello World!" });
    response.addHeaders({ "Content-Type": "text/html" });
    response.serveFile(ctx, "./dist/tests/assets/test.html");
  }
}
let mergeStart = performance.now();

server.router.merge(router2, "/merged");

console.log(`Merged in ${performance.now() - mergeStart}ms`);

let serverStart = performance.now();

server.run(config);

console.log(`Server started in ${performance.now() - serverStart}ms`);

const client = http2.connect(`https://${config.host}:${config.port}/`, {
  ca: fs.readFileSync("localhost-cert.pem"),
  rejectUnauthorized: false,
});

// Test GET request

let testsGetStart = performance.now();
var req = client.request({
  ":path": "/tests/get/",
});

req.on("response", (h, f) => {
  console.log(
    `/tests/get/ request completed in ${performance.now() - testsGetStart}ms`
  );
  console.log(h);
  console.log(f);
  console.log("\n\n");
});
req.end();

let mergedTestsGetStart = performance.now();
var req2 = client.request({
  ":path": "/merged/tests/get/",
});
req2.on("response", (h, f) => {
  console.log(
    `/merged/tests/get/ request completed in ${
      performance.now() - mergedTestsGetStart
    }ms`
  );
  console.log(h);
  console.log(f);
  console.log("\n\n");
});
req2.end();

// Test error handling
let errorStart = performance.now();
var req3 = client.request({
  ":path": "/tests/",
});
req3.on("response", (h, f) => {
  console.log(`Error response in ${performance.now() - errorStart}ms`);
  console.log(h);
  console.log(f);
  console.log("\n\n");
});

req3.end();
