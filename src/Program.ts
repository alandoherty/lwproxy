const net = require("net"),
    dgram = require("dgram"),
    fs = require("fs");

import {NetProxy} from "./NetProxy";
declare var process;

// check configuration file exists
if (!fs.existsSync("./lwproxy.json")) {
    console.error("[lwproxy] no proxy configuration found");
    process.exit(1);
}

// load configuration
const proxyConfig = JSON.parse(fs.readFileSync("./lwproxy.json", {
    "flag" : "r",
    "encoding": "utf8"
}));

// parse configuration
if (!proxyConfig.target) {
    console.error("[lwproxy] no source and target specified in proxy configuration");
    process.exit(1);
}

const proxy = new NetProxy(<string>proxyConfig.src || "0.0.0.0", <string>proxyConfig.target);
const proxyConfigs = proxyConfig.configs || [];

for(var i = 0; i < proxyConfigs.length; i++) {
    var cfg = proxyConfigs[i];

    if (cfg.type === "tcp")
        proxy.addTcpProvider(parseInt(cfg.port), parseInt(cfg.port));
    else if (cfg.type === "udp")
        proxy.addUdpProvider(parseInt(cfg.port), parseInt(cfg.port));
    else
        console.error("invalid provider type: " + cfg.type);
}

// start
proxy.start();

console.log("[lwproxy] started proxy, forwarding " + proxy.getSrcHost() + " to " + proxy.getTargetHost());