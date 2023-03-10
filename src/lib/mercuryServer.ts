import { errorHandlerCtx, MercuryServerOptions, runOptions } from "../types.js"
import { Router } from "./router.js"

import * as http2 from 'node:http2'
import * as fs from 'node:fs'
import { execSync } from 'node:child_process'
import { cwd } from 'node:process'
import { MonitorAPI } from "./apis/monitor.js"


export class MercuryServer implements http2.Http2SecureServer { 

    devServer: boolean
    router: Router
    HTTP2: http2.Http2SecureServer

    // Wall of HTTP2 methods/properties
    addListener: any
    on: any
    emit: any
    once: any
    prependListener: any
    prependOnceListener: any
    addContext: any
    getTicketKeys: any
    setSecureContext: any
    setTicketKeys: any
    listen: any
    close: any
    address: any
    getConnections: any
    ref: any
    unref: any
    maxConnections: any
    connections: any
    listening: any
    removeListener: any
    off: any
    removeAllListeners: any
    setMaxListeners: any
    getMaxListeners: any
    listeners: any
    rawListeners: any
    listenerCount: any
    eventNames: any
    setTimeout: any
    updateSettings: any

    // To avoid errors when accessing properties
    [key: string | number | symbol]: any
    
    constructor(options: MercuryServerOptions) {

        // Temp var, needed before super is initialized, but also needs to be on class' this.
        this.devServer = false

        if (options.dev) {

            try {

                // Generate keys for development server
                console.log(execSync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj \/CN=localhost -keyout localhost-privkey.pem -out localhost-cert.pem`))

                // Sets development serber keys
                options.key = fs.readFileSync(cwd() + '/localhost-privkey.pem'),
                options.cert = fs.readFileSync(cwd() + '/localhost-cert.pem')
                
            } catch (e) {

                // Logs error if something goes wrong
                console.error(`FATAL ERROR: Unable to generate and read dev server keys\n\nFull error:\n${e}`)

            } finally {
                
                // Set this.devServer to true no matter what
                this.devServer = true

            }
        
        }

        let staticPath = options.staticPath

        // Remove custom key/value pairs ready to be passed to createSecureServer
        delete options.staticPath
        delete options.dev

        // Initialises http2.http2SecureServer with createSecureServer function
        // @ts-ignore
        this.HTTP2 = http2.createSecureServer(options)
        
        // Wall of HTTP2 implementations
        this.addListener = this.HTTP2.addListener
        this.on = this.HTTP2.on
        this.emit = this.HTTP2.emit
        this.once = this.HTTP2.once
        this.prependListener = this.HTTP2.prependListener
        this.prependOnceListener = this.HTTP2.prependOnceListener
        this.addContext = this.HTTP2.addContext
        this.getTicketKeys = this.HTTP2.getTicketKeys
        this.setSecureContext = this.HTTP2.setSecureContext
        this.setTicketKeys = this.HTTP2.setTicketKeys
        this.listen = this.HTTP2.listen
        this.close = this.HTTP2.close
        this.address= this.HTTP2.address
        this.getConnections = this.HTTP2.getConnections
        this.ref = this.HTTP2.ref
        this.unref = this.HTTP2.unref
        this.maxConnections = this.HTTP2.maxConnections
        this.connections = this.HTTP2.connections
        this.listening = this.HTTP2.listening
        this.removeListener = this.HTTP2.removeListener
        this.off = this.HTTP2.off
        this.removeAllListeners = this.HTTP2.removeAllListeners
        this.setMaxListeners = this.HTTP2.setMaxListeners
        this.getMaxListeners = this.HTTP2.getMaxListeners
        this.listeners = this.HTTP2.listeners
        this.rawListeners = this.HTTP2.rawListeners
        this.listenerCount = this.HTTP2.listenerCount
        this.eventNames = this.HTTP2.eventNames
        this.setTimeout = this.HTTP2.setTimeout
        this.updateSettings = this.HTTP2.updateSettings

        // Adds router to this
        this.router = new Router(this, staticPath)
        this.use(MonitorAPI)

        let routerMethods = Reflect.ownKeys(Object.getPrototypeOf(this.router))
        for (let i in routerMethods) { 
            let methodName = routerMethods[i]
            if (methodName != "constructor") {
                this.router[methodName] = this.MonitorAPI.wrapEvent(this.router[methodName], this.router, methodName)
            } else {
                continue
            }
        }

        // Bind listener from router to request event
        this.HTTP2.on("request", (req, res) => { this.router.routingListener(req, res) })

    }

    // Adds logging to server.listen()
    public run(options?: runOptions, callback?: () => void): void {

        this.HTTP2.listen(options, callback)
        console.log('Opened server on', this.HTTP2.address())
    
    }

    public serveError(ctx: errorHandlerCtx): void {

        this.router.errorHandler(ctx)

    }

    public use<T extends { new(...args: any[]): {} }>(constructor: T, args?: any[]): void {
        if (args === undefined) { 
            this[constructor.name] = new constructor(this)
        }
        else {
            this[constructor.name] = new constructor(this, ...args)
        }
    }
}