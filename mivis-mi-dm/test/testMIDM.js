var MIUtil = require("../index");

var mi = new MIUtil();

mi.sendWhoisCommand();


setInterval(function(){
    console.log("**********GW**************");
    console.log(JSON.stringify(mi.getAllGateways()));
    console.log("**********DEV**************");
    console.log(JSON.stringify(mi.getAllDevices()));
    // mi.gwControlLight("7811dce1b453",true,"3F6A8D809374400A");
},1000)
