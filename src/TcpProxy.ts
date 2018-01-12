import {IProxyProvider} from "./NetProxy";
import {EventEmitter} from "events";
import {Socket, Server} from "net";

const net = require("net");

export class TcpProxy implements IProxyProvider {
    private _srcPort: number;
    private _srcHost: string;
    private _targetPort: number;
    private _targetHost: string;
    private _listener: any;
    private _connections: Array<TcpProxyConnection>;

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

    start() {
        const proxy = this;

        this._listener = net.createServer(function(socket: Socket) {
            // create connection
            const conn = new TcpProxyConnection(socket, proxy);

            proxy._connections.push(conn);
            console.log("[lwproxy] got connection from " + socket.address().address);

            // add close handler to remove connections
            conn.on("close", function() {
                proxy._connections.splice(proxy._connections.lastIndexOf(conn), 1);
                console.log("[lwproxy] lost connection from " + socket.address().address);
            });
        });

        this._listener.listen(this._srcPort, this._srcHost);
    }

    stop() {
        // stop listening
        this._listener.close();

        // close all connections
        for(var i = 0; i < this._connections.length; i++) {
            this._connections[i].close();
        }
    }

    constructor(srcHost: string, srcPort: number, targetHost: string, targetPort: number) {
        this._srcHost = srcHost;
        this._srcPort = srcPort;
        this._targetHost = targetHost;
        this._targetPort = targetPort;
        this._connections = new Array<TcpProxyConnection>();
    }
}

class TcpProxyConnection extends EventEmitter {
    private _localSocket: Socket;
    private _remoteSocket: Socket;
    private _remoteConnected: boolean;
    private _closed: boolean;
    private _proxy: TcpProxy;
    private _sendQueue: Array<Buffer>;

    /**
     * Gets the underlying socket.
     * @returns {"net".Socket}
     */
    getSocket() : Socket {
        return this._localSocket;
    }

    /**
     * Closes the connection.
     */
    close() {
        this._localSocket.end();
    }

    constructor(localSocket: Socket, proxy: TcpProxy) {
        super();
        const conn = this;

        this._proxy = proxy;
        this._sendQueue = new Array<Buffer>();

        // setup local socket
        this._localSocket = localSocket;
        this._localSocket.on("close", function() {
            if (!conn._closed)
                conn.emit("close");
            conn._closed = true;
        });
        this._localSocket.on("data", function(data: Buffer) {
            if (conn._remoteConnected) {
                conn._remoteSocket.write(data);
            } else {
                conn._sendQueue.push(data);
            }
        });

        this._remoteSocket = new Socket();
        this._remoteSocket.connect(proxy.getTargetPort(), proxy.getTargetHost(), function() {
            conn._remoteConnected = true;

            // flush the send queue
            for(var i = 0; i < conn._sendQueue.length; i++) {
               conn._remoteSocket.write( conn._sendQueue.pop());
            }
        });
        this._remoteSocket.on("close", function() {
            if (!this._closed)
                conn.emit("close");

            conn._closed = true;
            conn._remoteConnected = false;
        });
        this._remoteSocket.on("data", function(data: Buffer) {
            conn._localSocket.write(data);
        });
    }
}