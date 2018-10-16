var os = require('os');
var ips = undefined;

function getIpArray(){
    ips = [];
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                ips.push({ip:address.address,mac:address.host||address.mac});
            }
        }
    }
    return ips;
}

function getMac(){
    if(ips === undefined){
        getIpArray();
    }
    return ips[0].mac;
}

function getIp(){
    if(ips === undefined){
        getIpArray();
    }
    return ips[0].ip;
}

module.exports = {
    getIp:getIp,
    getMac:getMac,
    getIpArray:getIpArray
}