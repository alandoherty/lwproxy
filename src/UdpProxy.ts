import {IProxyProvider} from "./NetProxy";

const dgram = require("dgram");

export class UdpProxy implements IProxyProvider {
    private _srcPort: number;
    private _srcHost: string;
    private _targetPort: number;
    private _targetHost: string;
    private _socket: any;

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
        this._socket = dgram.createSocket("udp4");
        this._socket.on("message", function(data: Buffer) {
            console.log("buffer");
        });
        this._socket.bind(this._srcPort);
    }

    stop() {
        this._socket.close();
    }

    private onMessage(msg: Buffer, rinfo: any) {

    }

    constructor(srcHost: string, srcPort: number, targetHost: string, targetPort: number) {
        this._srcHost = srcHost;
        this._srcPort = srcPort;
        this._targetHost = targetHost;
        this._targetPort = targetPort;
    }
}