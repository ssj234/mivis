var Broadlink = require("../index.js");
var BroadlinkDM = Broadlink.BroadlinkDM;
var logger = require("sirivis-core").Log("sirivis-broadlink-dm","TCPServer","INFO");

var blink = new BroadlinkDM();
blink.discover(null);
blink.openTCPServer();
logger.info("Open tcp server...");