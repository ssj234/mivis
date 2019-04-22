var BroadlinkDM = require("../index.js").BroadlinkDM;
var http = require("http");

var blink = new BroadlinkDM();
blink.discover(null);

setInterval(function(){
    for(var i in blink.devices){
        var dev = blink.devices[i];
        console.log("[dev]" + dev.showName +"  "+ dev.type + " "+ dev.updateTime);
        if(dev.type != "SP2" && dev.reachable){
            dev.check_sensors();
        }
    }
    console.log("-------------------------");
},20000);