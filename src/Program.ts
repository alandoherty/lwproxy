const net = require("net"),
    dgram = require("dgram"),
    fs = require("fs");

import {NetProxy} from "./NetProxy";
declare var process;

// setup command line options
const commander = require("commander");

commander.version("0.1.0")
    .option("-c, --config <path>", "The configuration file path")
    .option("-l, --log", "Enable verbose logging")
    .name("lwproxy")
    .parse(process.argv);

let cfgPath: string = "./lwproxy.json";

if (commander.config)
    cfgPath = commander.config;

// check configuration file exists
if (!fs.existsSync(cfgPath)) {
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
    var srcPort = cfg.port ? parseInt(cfg.port) : parseInt(cfg.srcPort);
    var targetPort = cfg.port ? parseInt(cfg.port) : parseInt(cfg.targetPort);

    if (cfg.type === "tcp") {
        proxy.addTcpProvider(srcPort, targetPort);
        console.log("[lwproxy] added tcp proxy " + srcPort + " -> " + targetPort);
    } else if (cfg.type === "udp") {
        proxy.addUdpProvider(srcPort, targetPort);
        console.log("[lwproxy] added udp proxy " + srcPort + " -> " + targetPort);
    } else {
        console.error("[lwproxy] invalid provider type: " + cfg.type);
    }
}

// start
proxy.start();

console.log("[lwproxy] started proxy, forwarding " + proxy.getSrcHost() + " to " + proxy.getTargetHost());