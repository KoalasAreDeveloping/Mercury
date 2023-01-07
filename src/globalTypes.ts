export declare type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

export declare type http2SettingsObject = {

    headerTableSize?: number,
    enablePush?: boolean,
    initialWindowSize?: number,
    maxFrameSize?: number,
    maxConcurrentStreams?: number,
    maxHeaderListSize?: number,
    maxHeaderSize?: number,
    enableConnectProtocol?: boolean
}

