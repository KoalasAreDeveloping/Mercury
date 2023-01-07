import { Router } from "./router.js"

import * as http2 from 'node:http2'
import * as fs from 'node:fs'
import { exec } from 'node:child_process'
import { cwd } from 'node:process'

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
    
    constructor(options: MercuryServerOptions) {

        // Temp var, needed before super is initialized, but also needs to be on class' this.
        this.devServer = false

        if (options.dev) {

            try {

                // Generate keys for development server
                exec("openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj \/CN=localhost -keyout localhost-privkey.pem -out localhost-cert.pem", (err, stdout, stderr) => {})

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

        // Remove custom key/value pairs ready to be passed to createSecureServer 
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
        this.router = new Router()

        // Bind listener from router to request event
        // @ts-ignore
        this.HTTP2.on("request", (req, res) => { this.router.routingListener(req, res) })


    }

    // Adds logging to server.listen()
    public run(options?: runOptions, callback?) {

        this.HTTP2.listen(options, callback)
        console.log('Opened server on', this.HTTP2.address())
    
    }
    
}

// TYPES

import * as tls from "node:tls"

import * as globalTypes from "../globalTypes"
import { ListenOptions, AddressInfo } from "net"


declare function SNICallbackFn(servername: string, callback: Function): void
declare function pskCallbackFn(socket: tls.TLSSocket, identity: string) : Buffer | globalTypes.TypedArray | DataView

export declare type MercuryServerOptions = {
    
    dev?: boolean,
    allowHTTP1?: boolean,
    maxDeflateDynamicTableSize?: number,
    maxSettings?: number,
    maxSessionMemory?: number,
    maxHeaderListPairs?: number,
    maxOutstandingPings?: number,
    maxSendHeaderBlockLength?: number,
    paddingStrategy?: number,
    maxSessionInvalidFrames?: number,
    maxSessionRejectedStreams?: number,
    settings?: globalTypes.http2SettingsObject,
    origins?: string[],
    unknownProtocolTimeout?: number,
    ALPNProtocols?: string[] | Buffer[] | globalTypes.TypedArray[] | DataView[] | Buffer | globalTypes.TypedArray | DataView,
    clientCertEngine?: string,
    enableTrace?: boolean,
    handshakeTimeout?: number,
    rejectUnauthorized?: boolean,
    requestCert?: boolean,
    sessionTimeout?: number,
    SNICallback?: typeof SNICallbackFn,
    ticketKeys?: Buffer,
    pskCallback?: typeof pskCallbackFn,
    pskIdentityHint?: string,
    ca?: string | string[] | Buffer | Buffer[],
    cert?: string | string[] | Buffer | Buffer[],
    sigalgs?: string,
    ciphers?: string,
    crl?: string | string[] | Buffer | Buffer[],
    dhparam?: string | Buffer,
    ecdhCurve?: string,
    honorCipherOrder?: boolean,
    key?: string | string[] | Buffer | Buffer[] | Object[],
    privateKeyEngine?: string,
    privateKeyIdentifier?: string,
    maxVersion?: string,
    minVersion?: string,
    passphrase?: string,
    pfx?: string | string[] | Buffer | Buffer[] | Object[],
    secureOptions?: number,
    secureProtocol?: string,
    sessionIdContext?: string,
    allowHalfOpen?: boolean,
    pauseOnConnect?: boolean,
    noDelay?: boolean,
    keepAlive?: boolean,
    keepAliveInitialDelay?: number
}

export declare type runOptions = {

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
