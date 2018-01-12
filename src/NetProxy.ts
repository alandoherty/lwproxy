/**
 * Defines an interface for proxies.
 */
import {UdpProxy} from "./UdpProxy";
import {TcpProxy} from "./TcpProxy";

export interface IProxyProvider {
    getSourcePort(): number;
    getSourceHost(): string;
    getTargetPort(): number;
    getTargetHost(): string;

    start();
    stop();
}


/**
 * Provides a set of proxy servers.
 */
export class NetProxy {
    private _srcHost: string;
    private _targetHost: string;
    private _proxies: Array<IProxyProvider>;

    getSrcHost(): string {
        return this._srcHost;
    }

    getTargetHost(): string {
        return this._targetHost;
    }

    /**
     * Adds a UDP provider proxy for the configured target and source address.
     * @param {number} srcPort
     * @param {number} targetPort
     * @returns {UdpProxy}
     */
    addUdpProvider(srcPort: number, targetPort: number) : UdpProxy {
        const udpProxy = new UdpProxy(this._srcHost, srcPort, this._targetHost, targetPort);
        this._proxies.push(udpProxy);
        return udpProxy;
    }

    /**
     * Adds a TCP provider proxy for the configured target and source address.
     * @param {number} srcPort
     * @param {number} targetPort
     * @returns {TcpProxy}
     */
    addTcpProvider(srcPort: number, targetPort: number) {
        const tcpProxy = new TcpProxy(this._srcHost, srcPort, this._targetHost, targetPort);
        this._proxies.push(tcpProxy);
        return tcpProxy;
    }

    /**
     * Starts all proxies.
     */
    start() {
        for(var i = 0; i < this._proxies.length; i++) {
            this._proxies[i].start();
        }
    }

    /**
     * Stops all proxies.
     */
    stop() {
        for(var i = 0; i < this._proxies.length; i++) {
            this._proxies[i].stop();
        }
    }

    constructor(srcHost: string, targetHost: string) {
        this._proxies = new Array<IProxyProvider>();
        this._srcHost = srcHost;
        this._targetHost = targetHost;
    }
}