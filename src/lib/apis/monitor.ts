// Monitor handles performance monitoring and event logging.
import { performance } from "node:perf_hooks"
import { randomUUID } from "node:crypto"

import * as fs from "node:fs"
import { cwd } from "node:process"

import { MercuryServer } from "../mercuryServer.js"
import { routeHandlerCtx, eventObject } from "../../types.js"


export class MonitorAPI {

    logFilepath: string
    current: Object
    server: MercuryServer

    constructor(server: MercuryServer) {
        this.server = server

        // Generate unique file name.
        this.logFilepath = `${cwd()}/logs/MONITOR-${randomUUID()}.mercury.log`

        // Current is the current log object.
        this.current = { nodeTiming: performance.nodeTiming.toJSON(), events: [] }

  
        try {
            fs.accessSync(`${cwd()}/logs`)
        } catch (e) { 
            // If directory does not exist then create it
            fs.mkdirSync(`${cwd()}/logs`)
        }

        // Create file.
        fs.createWriteStream(this.logFilepath).end()

        // Update file every hour and on exits
        process.on("exit", (code) => {
            this.updateEventLogFile()
            process.exit(code)
        })

        process.on("SIGINT", () => {
            this.updateEventLogFile()
            process.exit()
        })

        process.on("SIGQUIT", () => {
            this.updateEventLogFile()
            process.exit()
        })

        process.on("SIGTERM", () => {
            this.updateEventLogFile()
            process.exit()
        })

        setInterval(() => { this.updateEventLogFile() }, 3600000) 

        this.server.router.routeFn("/mercury/api/monitor/logEvent/", (ctx: routeHandlerCtx) => { 
            
            let eventJSON: string

            // Get chunked data and add to the string
            ctx.req.on("data", (data) => {
                eventJSON += data.toString()
            })

            // log event at the end of the request
            ctx.req.on("end", () => {
                this.logEvent(JSON.parse(eventJSON))
            })


        })
        
    }

    private updateEventLogFile() {

        // Load session logs
        let logJSON: Object

        try {
            logJSON = JSON.parse(fs.readFileSync(this.logFilepath, "utf-8"))
        } catch (e) { 
            logJSON = {}
        }

        // Add new data as timestamp
        logJSON = logJSON[Date.now()] = this.current

        // Reset current
        this.current = {}

        fs.writeFileSync(this.logFilepath, JSON.stringify(logJSON, undefined, 4))

    }

    public logEvent(event: eventObject) {
        this.current["events"].push(event)
    }

    public trackEvent(eventName: string, eventDetails?: object) {

        let timestamp = Date.now()
        let end: number
        // Get start tiem
        let start = performance.now()

        // Decorator
        var self = this
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {

            // Store method
            var originalMethod = descriptor.value

            // Wrap method
            descriptor.value = (...args: any[]) => {

                // Call method
                let val = originalMethod.apply(target, args)
                // Get end time
                end = performance.now()
                // log event
                self.logEvent({ ...eventDetails, eventName: eventName, event: "CALL", eventDuration: end - start, timestamp: timestamp })

                return val
            }

            return descriptor
        }

    }

    public wrapEvent<T extends Function>(eventFn: T, _this: T, eventName: string, eventDetails?: object) {

        let timestamp = Date.now()
        let end: number
        // Get start tiem
        let start = performance.now()

        // Decorator
        var self = this
        return function (...args: any[]) {

            // Call method

            let val = eventFn.apply(_this, args)
            // Get end time
            end = performance.now()
            // log event
            self.logEvent({ ...eventDetails, eventName: eventName, event: "CALL", eventDuration: end - start, timestamp: timestamp })

            return val
            
        }

    }

}