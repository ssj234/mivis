var Broadlink = require("../index.js");
var BroadlinkDM = Broadlink.BroadlinkDM;
var CMD = Broadlink.TCPCMD;
var http = require("http");
var TCPClient = Broadlink.TCPClient;
var logger = require("sirivis-core").Log("sirivis-broadlink-dm","TCPServer","INFO");

var blink = new BroadlinkDM();
blink.discover(null);
blink.openTCPServer();