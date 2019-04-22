var Broadlink = require("../index.js");
var BroadlinkDM = Broadlink.BroadlinkDM;
var CMD = Broadlink.TCPCMD;
var http = require("http");
var TCPClient = Broadlink.TCPClient;
var logger = require("sirivis-core").Log("sirivis-broadlink-dm","TCPClient");


var client = new TCPClient();
client.openClient();
client.on(CMD.LEARN_IR,function(data){
    logger.info("learned",data);
});
client.learnIR("34:ea:34:58:b4:6f");

setInterval(function(){
        
},15000);

