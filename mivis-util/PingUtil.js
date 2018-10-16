// ping.js 目的是ping整个网段，获取ip与mac的映射信息
// 因为设备的ip可能会发生变化，但是mac地址不会变化，但某些插件的配置信息使用的是ip
// 因此，在启动homebridge之前，可以根据映射关系更新一下配置
// 可以通过arp -a查看映射关系
const childProcess = require('child_process');
const exec = childProcess.exec
const os = require("os");
const script = os.homedir() + "/mivis-tools/bin/mivis_pings";

var devInfo = require("./DevUtil");

function ping(){
    var ret = [];
    var ips = devInfo.getIpArray();
	for(var idx in ips){
		var ip = ips[idx].ip;
		var arr = ip.split(".");
		arr.splice(3,1);
        ipPrefix = arr.join(".")+".";
        if(ret.indexOf(ipPrefix) == -1){
            ret.push(ipPrefix);
        }
    }
    for(var idx in ret){
        exec(script+" " +ret[idx]);
    }
}

module.exports={
    ping:ping
}