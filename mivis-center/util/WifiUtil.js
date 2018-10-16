
const exec = require('child_process').exec;
const ifconfig = require('wireless-tools/ifconfig');
const iwconfig = require('wireless-tools/iwconfig');
const os = require("os");

const SSID = "wpa-ssid";
const PSK = "wpa-psk";
const base = "/home/pi/mivis/conf/interfaces";
const basebak = "/home/pi/mivis/conf/interfaces.bak";
const command0 = "cp "+base+" "+basebak;
const command1 = 'sed -i "s/#SSID#/#SSID_VALUE#/g" '+basebak;
const command2 = 'sed -i "s/#PSK#/#PSK_VALUE#/g" '+basebak;
const command3 = 'sudo cp '+basebak + " /etc/network/interfaces";

const info = () => {
    return new Promise((resolve, reject) => {
        exec("cat /etc/network/interfaces", function (err, stdout, stderr) {
            var ret = {};
            if(err){
                 resolve(ret);
            }
            stdout.split('\n').filter((line) => {
                if(line.indexOf(SSID) > -1){
                    ret.ssid = line.replace(SSID,'').replace('"','').replace('"','').trim();
                }else if(line.indexOf(PSK) > -1){
                    ret.psk = line.replace(PSK,'').replace('"','').replace('"','').trim();
                }
            });
             resolve(ret);
        });
    });
  };

function set(ssid,psk){
    var command = command0 +" && " + (command1.replace("#SSID_VALUE#",ssid))
        + " && " + (command2.replace("#PSK_VALUE#",psk))
        + " && " + command3;
    return new Promise((resolve, reject) => {
        exec(command, function (err, stdout, stderr) {
            if(err){
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

var networkInfo;
function network(){
    var interfaces = os.networkInterfaces();
    if (networkInfo) {
        return  networkInfo;
    } else {
        networkInfo = [];
        for (var k in interfaces) {
            // console.log(interfaces[k]);
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    networkInfo.push(address);
                }
            }
        }
        return  networkInfo;
    }
}


function networkCard (){
    ifconfig.status(function(err, status) { // 获取所有网卡名称
        console.log("===================ifconfig");
      console.log(status);
    });
}



const wifiConfig = () => {
    return new Promise((resolve, reject) => {
        iwconfig.status(function(err, status) { // wifi连接状态
            resolve(status);
        });
    });
  };

  
module.exports={
    info:info,
    set:set,
    network:network,
    wifiConfig:wifiConfig
}

// console.log(network());