var BroadlinkDM = require("../index.js").BroadlinkDM;
var http = require("http");

var blink = new BroadlinkDM();
blink.discover(null);

setInterval(function(){
    console.info(">>>>> begin scan devices! <<<<<");
    blink.rediscover();
    for(var i in blink.devices){
        var dev = blink.devices[i];
        console.info("[%s] type is[%s], reachable is [%s]" , dev.showName , dev.type , dev.reachable);
    }
},5000);