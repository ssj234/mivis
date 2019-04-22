var MIUtil = require("../index");

var mi = new MIUtil();

mi.sendWhoisCommand();


setTimeout(function(){
    console.log("**********GW**************");
    console.log(JSON.stringify(mi.getAllGateways()));
    console.log("**********DEV**************");
    console.log(JSON.stringify(mi.getAllDevices()));
    mi.acPower("7c49eb82b2c6",true,"1ini0b4dac899wjh");
},5000)
