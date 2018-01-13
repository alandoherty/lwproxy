import {IProxyProvider} from "./NetProxy";
import {Socket} from "dgram";
import {TcpProxy} from "./TcpProxy";
import {EventEmitter} from "events";

const dgram = require("dgram");

/**
 * Provides UDP datagram proxying.
 */
export class UdpProxy implements IProxyProvider {
    private _srcPort: number;
    private _srcHost: string;
    private _targetPort: number;
    private _targetHost: string;
    private _connections: object;
    private _localSocket: Socket;
    private _removeTimeout: any;

    getSourcePort(): number {
        return this._srcPort;
    }

    getSourceHost(): string {
        return this._srcHost;
    }

    getTargetPort(): number {
        return this._targetPort;
    }

    getTargetHost(): string {
        return this._targetHost;
    }

    getLocalSocket(): Socket {
        return this._localSocket;
    }

    /**
     * Starts proxying UDP data.
     */
    start() {
        const proxy = this;

        this._removeTimeout = setTimeout(function() {
            for (let k in proxy._connections) {
                if (proxy._connections.hasOwnProperty(k)) {
                    const conn = proxy._connections[k];

                    if (Date.now() - conn.getLastDataTimestamp() > 60000) {
                        conn.close();
                        delete proxy._connections[k];
                    }
                }
            }
        }, 5000);
    }

    /**
     * Stops proxying UDP data and closes all connections.
     */
    stop() {
        this._localSocket.close();

        // close all connections
        for (let k in this._connections) {
            if (this._connections.hasOwnProperty(k)) {
                this._connections[k].close();
                delete this._connections[k];
            }
        }

        // cancel timeout
        clearTimeout(this._removeTimeout);
    }

    constructor(srcHost: string, srcPort: number, targetHost: string, targetPort: number) {
        const proxy = this;

        this._srcHost = srcHost;
        this._srcPort = srcPort;
        this._targetHost = targetHost;
        this._targetPort = targetPort;
        this._localSocket = dgram.createSocket("udp4");
        this._localSocket.bind(srcPort, srcHost);
        this._localSocket.on("message", function(message: Buffer, rinfo: object) {
            let conn: UdpProxyConnection;
            const connId = rinfo["address"] + ":" + rinfo["port"];

            if (proxy._connections.hasOwnProperty(connId)) {
                conn = proxy._connections[connId];
                conn.updateLastDataTimestamp();
            } else {
                conn = new UdpProxyConnection(rinfo["address"], rinfo["port"], proxy);
                proxy._connections[connId] = conn;
            }

            conn.getRemoteSocket().send(message, targetPort, targetHost);
        });
    }
}

class UdpProxyConnection extends EventEmitter {
    private _remoteSocket: Socket;
    private _closed: boolean;
    private _proxy: UdpProxy;
    private _localAddr: string;
    private _localPort: number;
    private _lastDataTimestamp: number;

    getRemoteSocket(): Socket {
        return this._remoteSocket;
    }

    getLastDataTimestamp(): number {
        return this._lastDataTimestamp;
    }

    updateLastDataTimestamp() {
        this._lastDataTimestamp = Date.now();
    }

    /**
     * Closes the connection.
     */
    close() {
        this._remoteSocket.close();
    }

    constructor(localAddr: string, localPort: number, proxy: UdpProxy) {
        super();
        const conn = this;

        this._lastDataTimestamp = Date.now();
        this._localAddr = localAddr;
        this._localPort = localPort;
        this._proxy = proxy;

        // setup local socket
        this._remoteSocket =  dgram.createSocket("udp4");
        this._remoteSocket.on("close", function() {
            if (!this._closed)
                conn.emit("close");

            conn._closed = true;
        });
        this._remoteSocket.on("message", function(data: Buffer, rinfo: object) {
            conn._lastDataTimestamp = Date.now();
            conn._proxy.getLocalSocket().send(data, conn._localPort, conn._localAddr);
        });
        this._remoteSocket.bind();
    }
}