var HomeBridgeParse = require("../HomeBridgeParse");
var util = new HomeBridgeParse("http://127.0.0.1:19223","623-88-626");


// util.hbAccessories(function(data){
//     console.log(data.msg);
// });

util.hbGetStatus("1.2,2.9",function(data){
    console.log(data.msg);
});

// util.hbSetStatus(function(data){
//     console.log(data.msg);
// });