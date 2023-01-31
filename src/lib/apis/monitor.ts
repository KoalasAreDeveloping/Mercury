// Monitor handles performance monitoring and event logging.
import { performance } from "node:perf_hooks"
import { randomUUID } from "node:crypto"

import * as fs from "node:fs"

import { MercuryServer } from "../mercuryServer.js"
import { routeHandlerCtx } from "../../types.js"

export class MonitorAPI {

    logFilepath: string
    current: Object
    server: MercuryServer

    constructor(server: MercuryServer) {
        this.server = server

        // Generate unique file name.
        this.logFilepath = `logs/MONITOR-${randomUUID()}.mercury.log`

        // Current is the current log object.
        this.current = { nodeTiming: performance.nodeTiming.toJSON(), events: [] }

        // Update file every hour and on exits
        process.on("beforeExit", this.updateEventLogFile)
        setInterval(this.updateEventLogFile, 3600000) 

        this.server.router.routeFn("", (ctx: routeHandlerCtx) => { 
            
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
            logJSON = JSON.parse(String(fs.readFileSync(this.logFilepath)))
        } catch (e) { 
            logJSON = {}
        }

        // Add new data as timestamp
        logJSON = logJSON[Date.now()] = this.current

        // Reset current
        this.current = {}

        fs.writeFile(this.logFilepath, JSON.stringify(logJSON), (err) => {
            console.log(err)
        })
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
        return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {

            // Store method
            var originalMethod = descriptor.value

            // Wrap method
            descriptor.value = (...args: any[]) => {

                // Call method
                let val = originalMethod.apply(target, args)
                // Get end time
                end = performance.now()
                // log event
                this.logEvent({ ...eventDetails, eventName: eventName, event: "CALL", eventDuration: end - start, timestamp: timestamp })

                return val
            }

            return descriptor
        }

    }

}

export interface eventObject {

    eventName: string,
    event: string,
    eventDuration: number,
    timestamp: number,
    [key: string]: any

}