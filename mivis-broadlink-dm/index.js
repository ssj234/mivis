// var logger = require("sirivis-core").Log("sirivis-broadlink-dm","BroadlinkDM");
var logger = console;
var util = require('util');
var TCPCMD = require("./cmd");
let EventEmitter = require('events');
let dgram = require('dgram');
let os = require('os');
let crypto = require('crypto');
var learnRF = require("./learnRFData");
var learnData = require("./learnData");
const REDISCOVER_MILLSECOND = 10 * 1000; // 10S 重新发现一次
const UNREACHABLE_SECOND = 30;// 0.5分钟没有回应
const CUTDOWN_SECOND = 1 * 60; // 1分钟则断开连接
var BroadlinkDM  = function() {
    EventEmitter.call(this);
    this.devices = {}; //保存所有的设备
    this.conn = {};
}
util.inherits(BroadlinkDM, EventEmitter);

// RM Devices (with RF support)
const rmPlusDeviceTypes = {};
rmPlusDeviceTypes[parseInt(0x272a, 16)] = 'Broadlink RM2 Pro Plus';
rmPlusDeviceTypes[parseInt(0x2787, 16)] = 'Broadlink RM2 Pro Plus v2';
rmPlusDeviceTypes[parseInt(0x278b, 16)] = 'Broadlink RM2 Pro Plus BL';
rmPlusDeviceTypes[parseInt(0x279d, 16)] = 'Broadlink RM3 Pro Plus';
rmPlusDeviceTypes[parseInt(0x27a9, 16)] = 'Broadlink RM3 Pro Plus v2'; // (model RM 3422)
// rmPlusDeviceTypes[65593] = 'Broadlink RM3 Pro Plus v2 test';

// 返回Device实例
BroadlinkDM.prototype.rediscover = function() {
    rediscover(this.conn.cs,this.conn.packet,this.conn.target,this);
}
BroadlinkDM.prototype.genDevice = function(devtype, host, mac) {
    var dev = new device(host, mac,devtype);
    if (devtype == 0) { // SP1
        
        dev.sp1();
        return dev;
    } else if (devtype == 0x2711) { // SP2
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x2719 || devtype == 0x7919 || devtype == 0x271a || devtype == 0x791a) { // Honeywell SP2
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x2720) { // SPMini
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x753e) { // SP3
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x2728) { // SPMini2
        
        dev.sp2();
        return dev;
    }else if (devtype == 0X791b) { // QiangCha
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x2733 || devtype == 0x273e) { // OEM branded SPMini Contros
        
        dev.sp2();
        return dev;
    } else if (devtype >= 0x7530 && devtype <= 0x791c) { // OEM branded SPMini2
        
        dev.sp2();
        return dev;
    } else if (devtype == 0x2736) { // SPMiniPlus
        
        dev.sp2();
        return dev;
    }else if (devtype == 0x2712) { // RM2
           
           dev.rm();
           return dev;
       } else if (devtype == 0x2737) { // RM Mini
           
           dev.rm();
           return dev;
       } else if (devtype == 0x273d) { // RM Pro Phicomm
           
           dev.rm();
           return dev;
       } else if (devtype == 0x2783) { // RM2 Home Plus
           
           dev.rm();
           return dev;
       } else if (devtype == 0x277c) { // RM2 Home Plus GDT
           
           dev.rm();
           return dev;
       } else if (devtype == 0x272a) { // RM2 Pro Plus
           
           dev.rm();
           return dev;
       } else if (devtype == 0x2787) { // RM2 Pro Plus2
           
           dev.rm();
           return dev;
       } else if (devtype == 0x278b) { // RM2 Pro Plus BL
           
           dev.rm();
           return dev;
       } else if (devtype == 0x278f) { // RM Mini Shate
           
           dev.rm();
           return dev;
       } else if(devtype == 0x279d){ // RM3 Pro Plus
            // dev = new device(host,mac);
            dev.rm(true);
            return dev;
        }else if(devtype == 0x27a9){ //  RM2 Pro Plus3
            // dev = new device(host,mac);
            dev.rm(true);
            return dev;
        }else if(devtype == 0x27a6){ //  RM2 Pro PP
            // dev = new device(host,mac);
            dev.rm(true);
            return dev;
        }else if(devtype == 0x27a1){ //  RM2 Pro Plus R1
            // dev = new device(host,mac);
            dev.rm(true);
            return dev;
        }else if(devtype == 0x2797){ //  RM2 Pro Plus HYC
            // dev = new device(host,mac);
            dev.rm(true);
            return dev;
        }else if (devtype == 0x2714) { // A1
            
            dev.a1();
            return dev;
        } else if (devtype == 0x4EB5 || devtype == 0x4EF7) { // MP1 MP1: 0x4eb5, honyar oem mp1: 0x4ef7
            
            dev.mp1();
            return dev;
        } else if (devtype == 0x4F1B) { // MP2
            
            dev.mp2();
            return dev;
        } else if(devtype == 0x4EAD){ // Hysen controller
            
            dev.hysen();
            return dev;
        }else if(devtype == 0x2722){ // S1 (SmartOne Alarm Kit)
            
            dev.s1c();
            return dev;
        }else if(devtype == 0x4E4D){ //Dooya DT360E (DOOYA_CURTAIN_V2)
            
            dev.dooya();
            return dev;
        }else {
            dev.rm(true);
            logger.info("unknown device found... dev_type: " + devtype.toString(16) + " @ " + host.address);
            return dev;
    }
}
// 获取当前设备的IP地址
BroadlinkDM.prototype.getSelfIP = function(local_ip_address){
    var interfaces = os.networkInterfaces();
    if (local_ip_address) {
        return  local_ip_address;
    } else {
        var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        return  addresses[0];
    }
    return undefined;
}
/*BroadlinkDM.prototype.learnIR = function(mac){
    function checkInterval(){
        if(this.leaning){ // 学习中
            this.checkData();
            setTimeout(checkInterval.bind(this),1000)
        }else{
            this.cancelLearn();
        }
    }
    return new Promise(function (resolve, reject) {
        let thisDev = this.devices[mac];
        if(!thisDev){
            reject("cannot find device");
            return;
        }
        thisDev.leaning = true; // 学习中
        thisDev.resolve = resolve;
        if(!thisDev){
            thisDev.leaning = false;
            thisDev.resolve("cannot find device of " + mac);
            return;
        }
        if(!thisDev.learnIRCallback){
            thisDev.learnIRCallback = function(message){
                console.log(">>>>>callback",message);
                if(!thisDev.leaning){
                    thisDev.resolve(thisDev.IRHex);
                    return;
                }
                const hex = message.toString('hex');
                console.log('>>>>>>>>>>>>>>>>>message' + hex );
                thisDev.leaning = false;
                thisDev.IRHex = hex;
                thisDev.cancelLearn();// 取消学习
                thisDev.resolve(hex);
            }
            thisDev.on("rawData",thisDev.learnIRCallback.bind(this))
        }
    
        thisDev.enterLearning();// 开始学习
        setTimeout(checkInterval.bind(thisDev),1000)
        setTimeout(function(){
            if(thisDev.leaning){ // 学习中
                thisDev.leaning = false;
                thisDev.cancelLearn();// 取消学习
                thisDev.resolve("timeout");
                // console.log(1111111111111111);
                thisDev.removeListener("rawData",thisDev.learnIRCallback.bind(this))
            }
        },10*1000)
    }.bind(this));
}*/
BroadlinkDM.prototype.getDevice = function(mac){
    return this.devices[mac];
}

BroadlinkDM.prototype.deviceInfo = function(){
   var ret = {};
   for(let mac in this.devices){ // mac-->device
      let thisDev = this.devices[mac];
      ret[mac] = {
            host: thisDev.host,
            mac: thisDev.mac,
            showName: thisDev.showName,
            type: thisDev.type,
            updateTime: thisDev.updateTime,
            createTime: thisDev.createTime
       }
   }
   return ret;
}

function rediscover(cs,packet,target,self){
    // send broadcast
    cs.sendto(packet, 0, packet.length, 80, target);
    setTimeout(function(){
        //1.check device
        for(let mac in self.devices){ // mac-->device
            let thisDev = self.devices[mac];
            let interval = (new Date().getTime() - thisDev.updateTime) / 1000; //second
            // console.log("interval is" + interval);
            if(interval > CUTDOWN_SECOND || interval > UNREACHABLE_SECOND){ // 更长时间没有发现，需要断开连接,从devices中删除
                logger.error("[discover-x][%s]cannot be discovery in five minute,cut down!",thisDev.showName);
                thisDev.close();// 关闭与设备的连接
                delete self.devices[mac]; // 从devices中删除
                continue;
            }
            /*if(interval > UNREACHABLE_SECOND){ // 长时间没有发现，
                logger.error("[discover-x][%s]cannot be discovery in one minute,interval is %d",thisDev.showName,interval);
                thisDev.reachable = false;
            }*/
        }
    },1 * 1000);
}
function buildMac(mac){
    let ret = "";
    var t = mac.toString('hex');
    t = t.split("");
    for(let i in t){
        ret += t[i] ;
        ret += (i%2==1)?":":"";
    }
    return ret.substring(0,17);
}
// 开始发现设备
BroadlinkDM.prototype.discover = function(local_ip_address) {
    self = this;
    var address = this.getSelfIP(local_ip_address);
    if(!address){
        logger.error("Cannot find self IP-Address,you may not connect to a network!");
        return;
        // throw Error("Cannot find self IP-Address,you may not connect to a network!");
    }
    // 创建服务器，发送广播
    var cs = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    self.conn.cs = cs;
    cs.on('listening', function() {
        cs.setBroadcast(true);

        var port = cs.address().port;
        var now = new Date();
        var starttime = now.getTime();

        var timezone = now.getTimezoneOffset() / -3600; // 应该是处以60啊，-480/60=-8
        var packet = Buffer.alloc(0x30, 0);

        var year = now.getYear();

        if (timezone < 0) {
            packet[0x08] = 0xff + timezone - 1;
            packet[0x09] = 0xff;
            packet[0x0a] = 0xff;
            packet[0x0b] = 0xff;
        } else {
            packet[0x08] = timezone;
            packet[0x09] = 0;
            packet[0x0a] = 0;
            packet[0x0b] = 0;
        }
        packet[0x0c] = year & 0xff;
        packet[0x0d] = year >> 8;
        packet[0x0e] = now.getMinutes();
        packet[0x0f] = now.getHours();
        var subyear = year % 100;
        packet[0x10] = subyear;
        packet[0x11] = now.getDay();
        packet[0x12] = now.getDate();
        packet[0x13] = now.getMonth();
        var address_parts = address.split('.');
        packet[0x18] = parseInt(address_parts[0]);
        packet[0x19] = parseInt(address_parts[1]);
        packet[0x1a] = parseInt(address_parts[2]);
        packet[0x1b] = parseInt(address_parts[3]);
        packet[0x1c] = port & 0xff;
        packet[0x1d] = port >> 8;
        packet[0x26] = 6;
        var checksum = 0xbeaf;

        for (var i = 0; i < packet.length; i++) {
            checksum += packet[i];
        }
        checksum = checksum & 0xffff;
        packet[0x20] = checksum & 0xff;
        packet[0x21] = checksum >> 8;

        var target = "255.255.255.255";
        logger.debug("[discover-0]Send package to %s",target);
        cs.sendto(packet, 0, packet.length, 80, target);

        self.conn.packet = packet;
        self.conn.target = target;
        // setTimeout(function(){
            // rediscover(cs,packet,target,self);
        // },REDISCOVER_MILLSECOND);
    });

    cs.on("message", (msg, rinfo) => {
        
        var host = rinfo;
        logger.debug("[onMessage]Receive response from "+host.address);

        var mac = Buffer.alloc(6, 0);
        msg.copy(mac, 0x00, 0x3F);
        msg.copy(mac, 0x01, 0x3E);
        msg.copy(mac, 0x02, 0x3D);
        msg.copy(mac, 0x03, 0x3C);
        msg.copy(mac, 0x04, 0x3B);
        msg.copy(mac, 0x05, 0x3A);

        var devtype = msg[0x34] | msg[0x35] << 8;
        if (!this.devices) {
            this.devices = {};
        }
        mac = buildMac(mac);
        if (!this.devices[mac]) {
            logger.debug("[discover-1]Receive response from %s##%s",host.address,mac);
            var dev = this.genDevice(devtype, host, mac);
            if (dev) {
                dev.reachable = true;
                this.devices[mac] = dev;
                dev.on("deviceReady", () => { this.emit("deviceReady", dev); });
                logger.debug("[discover-2]want to auth device of %s",mac);
                dev.auth();// 发送验证数据
            }
        }else{
            // exists!，更新时间
            this.devices[mac].reachable = true;
            this.devices[mac].updateTime = new Date().getTime();
        }

        
    });

    cs.on('close', function() {
        logger.info('DiscoverServer closed!');
    });
    cs.on('error', function(error) {
        logger.error("discover server occur an error: %s",error);
    });
    cs.bind(0, address);// 0：随机绑定一个端口
}

BroadlinkDM.prototype.RFScan =function (mac){
    let thisDev = this.devices[mac];
    if(!thisDev){
        return "###未能找到设备，请确认设备是否在线";
    }
    learnRF.start(thisDev,console.log,console.log,false);
    return learnRF.getStatus();
} 
BroadlinkDM.prototype.IRScan =function (mac){
    let thisDev = this.devices[mac];
    if(!thisDev){
        return "###未能找到设备，请确认设备是否在线";
    }
    learnData.start(thisDev,console.log,console.log,false);
    return learnData.getStatus();
} 


// 提供暴露服务
function device(host, mac, devtype, timeout = 10) {
    this.host = host;
    this.mac = mac;
    this.devtype = devtype;
    this.showName = host.address +"##" + mac;
    this.emitter = new EventEmitter();
    this.createTime = new Date().getTime();// 创建时间
    this.updateTime = new Date().getTime();// 更新时间
    this.on = this.emitter.on;
    this.emit = this.emitter.emit;
    this.removeListener = this.emitter.removeListener;

    this.timeout = timeout;
    this.count = Math.random() & 0xffff;
    this.key = new Buffer([0x09, 0x76, 0x28, 0x34, 0x3f, 0xe9, 0x9e, 0x23, 0x76, 0x5c, 0x15, 0x13, 0xac, 0xcf, 0x8b, 0x02]);
    this.iv = new Buffer([0x56, 0x2e, 0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58]);
    this.id = new Buffer([0, 0, 0, 0]);
    // 每个设备都会创建一个udp服务器，接收设备返回的信息
    this.cs = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.cs.on('listening', function() {
        //this.cs.setBroadcast(true);
    });
    this.cs.on("message", (response, rinfo) => { // auth()和发送指令后会返回
        this.updateTime = new Date().getTime();// 收到设备返回后就更新时间
        var enc_payload = Buffer.alloc(response.length - 0x38, 0);
        response.copy(enc_payload, 0, 0x38);

        var decipher = crypto.createDecipheriv('aes-128-cbc', this.key, this.iv);
        decipher.setAutoPadding(false);
        var payload = decipher.update(enc_payload);
        var p2 = decipher.final();
        if (p2) {
            payload = Buffer.concat([payload, p2]);
        }

        if (!payload) {
            return false;
        }

        var command = response[0x26];
        var err = response[0x22] | (response[0x23] << 8);

        if (err != 0) return;

        if (command == 0xe9) { // 设置auth()成功后的返回,执行设备的deviceReady，设备再执行broadlink的deviceReady
            this.key = Buffer.alloc(0x10, 0); // key 用来加密的，auth()后才能拿到key
            payload.copy(this.key, 0, 0x04, 0x14);

            this.id = Buffer.alloc(0x04, 0);
            payload.copy(this.id, 0, 0x00, 0x04);

            this.emit("deviceReady");
            logger.debug("[discover-3]receive auth info,the device ready! %s ",this.showName);
        } else if (command == 0xee) { // 发送指令后的回复
            this.emit("payload", err, payload);
        }

    });
    this.cs.bind();
    this.type = "Unknown";//不同的设备调用不同的方法修改type
}

device.prototype.auth = function() { // 向设备发送auth数据
    var payload = Buffer.alloc(0x50, 0);
    payload[0x04] = 0x31;
    payload[0x05] = 0x31;
    payload[0x06] = 0x31;
    payload[0x07] = 0x31;
    payload[0x08] = 0x31;
    payload[0x09] = 0x31;
    payload[0x0a] = 0x31;
    payload[0x0b] = 0x31;
    payload[0x0c] = 0x31;
    payload[0x0d] = 0x31;
    payload[0x0e] = 0x31;
    payload[0x0f] = 0x31;
    payload[0x10] = 0x31;
    payload[0x11] = 0x31;
    payload[0x12] = 0x31;
    payload[0x1e] = 0x01;
    payload[0x2d] = 0x01;
    payload[0x30] = 'T'.charCodeAt(0);
    payload[0x31] = 'e'.charCodeAt(0);
    payload[0x32] = 's'.charCodeAt(0);
    payload[0x33] = 't'.charCodeAt(0);
    payload[0x34] = ' '.charCodeAt(0);
    payload[0x35] = ' '.charCodeAt(0);
    payload[0x36] = '1'.charCodeAt(0);

    this.sendPacket(0x65, payload);
    logger.debug("[discover-2]send auth info to dev %s,then wait",this.showName);
}

// 退出
device.prototype.close = function() {
    var self = this;
    setTimeout(function() {
        self.cs.close();
    }, 500);
}

device.prototype.getType = function() {
    return this.type;
}

device.prototype.sendPacket = function(command, payload) {
    this.count = (this.count + 1) & 0xffff;
    var packet = Buffer.alloc(0x38, 0);
    packet[0x00] = 0x5a;
    packet[0x01] = 0xa5;
    packet[0x02] = 0xaa;
    packet[0x03] = 0x55;
    packet[0x04] = 0x5a;
    packet[0x05] = 0xa5;
    packet[0x06] = 0xaa;
    packet[0x07] = 0x55;
    packet[0x24] = 0x2a;
    packet[0x25] = 0x27;
    packet[0x26] = command;
    packet[0x28] = this.count & 0xff;
    packet[0x29] = this.count >> 8;
    packet[0x2a] = this.mac[0];
    packet[0x2b] = this.mac[1];
    packet[0x2c] = this.mac[2];
    packet[0x2d] = this.mac[3];
    packet[0x2e] = this.mac[4];
    packet[0x2f] = this.mac[5];
    packet[0x30] = this.id[0];
    packet[0x31] = this.id[1];
    packet[0x32] = this.id[2];
    packet[0x33] = this.id[3];

    var checksum = 0xbeaf;
    for (var i = 0; i < payload.length; i++) {
        checksum += payload[i];
        checksum = checksum & 0xffff;
    }

    var cipher = crypto.createCipheriv('aes-128-cbc', this.key, this.iv);
    payload = cipher.update(payload);
    var p2 = cipher.final();

    packet[0x34] = checksum & 0xff;
    packet[0x35] = checksum >> 8;

    packet = Buffer.concat([packet, payload]);

    checksum = 0xbeaf;
    for (var i = 0; i < packet.length; i++) {
        checksum += packet[i];
        checksum = checksum & 0xffff;
    }
    packet[0x20] = checksum & 0xff;
    packet[0x21] = checksum >> 8;
    logger.debug("send packet to %s",this.showName);
    this.cs.sendto(packet, 0, packet.length, this.host.port, this.host.address);
}

device.prototype.mp1 = function() {
    this.type = "MP1";

    this.set_power = function(sid, state) {
        //"""Sets the power state of the smart power strip."""
        var sid_mask = 0x01 << (sid - 1);
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0d;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xb2 + (state ? (sid_mask << 1) : sid_mask);
        packet[0x07] = 0xc0;
        packet[0x08] = 0x02;
        packet[0x0a] = 0x03;
        packet[0x0d] = sid_mask;
        packet[0x0e] = state ? sid_mask : 0;

        this.sendPacket(0x6a, packet);
    }

    this.check_power = function() {
        //"""Returns the power state of the smart power strip in raw format."""
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0a;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xae;
        packet[0x07] = 0xc0;
        packet[0x08] = 0x01;

        this.sendPacket(0x6a, packet);
    }

    this.on("payload", (err, payload) => {
        logger.debug("mp1 payload..");
        var param = payload[0];
        switch (param) {
            case 1:
                console.log("case 1 -");
                break;
            case 2:
                console.log("case 2 -");
                break;
            case 3:
                console.log("case 3 -");
                break;
            case 4:
                console.log("case 4 -");
                break;
            case 14:
                var s1 = Boolean(payload[0x0e] & 0x01);
                var s2 = Boolean(payload[0x0e] & 0x02);
                var s3 = Boolean(payload[0x0e] & 0x04);
                var s4 = Boolean(payload[0x0e] & 0x08);
                this.emit("mp_power", [s1, s2, s3, s4]);
                break;
            default:
                console.log("case default - " + param);
                break;
        }
    });
}

device.prototype.mp2 = function() {
    this.type = "MP2";

    this.set_power = function(sid, state) {
        //"""Sets the power state of the smart power strip."""
        var sid_mask = 0x01 << (sid - 1);
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0d;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xb2 + (state ? (sid_mask << 1) : sid_mask);
        packet[0x07] = 0xc0;
        packet[0x08] = 0x02;
        packet[0x0a] = 0x03;
        packet[0x0d] = sid_mask;
        packet[0x0e] = state ? sid_mask : 0;

        this.sendPacket(0x6a, packet);
    }

    this.check_power = function() {
        //"""Returns the power state of the smart power strip in raw format."""
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0a;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xae;
        packet[0x07] = 0xc0;
        packet[0x08] = 0x01;

        this.sendPacket(0x6a, packet);
    }

    this.on("payload", (err, payload) => {
        logger.debug("mp2 payload..");
        var param = payload[0];
        switch (param) {
            case 1:
                console.log("case 1 -");
                break;
            case 2:
                console.log("case 2 -");
                break;
            case 3:
                console.log("case 3 -");
                break;
            case 4:
                console.log("case 4 -");
                break;
            case 0x1b:
                var s1 = Boolean(payload[0x0e] & 0x01);
                var s2 = Boolean(payload[0x0e] & 0x02);
                var s3 = Boolean(payload[0x0e] & 0x04);
                var s4 = Boolean(payload[0x0e] & 0x08);
                this.emit("mp_power", [s1, s2, s3, s4]);
                break;
            default:
                console.log("case default - " + param);
                break;
        }
    });
}

device.prototype.sp1 = function() {
    this.type = "SP1";
    this.set_power = function(state) {
        var packet = Buffer.alloc(4, 4);
        packet[0] = state;
        this.sendPacket(0x66, packet);
    }
}



device.prototype.sp2 = function() {
    var self = this;
    this.type = "SP2";
    this.set_power = function(state) {
        //"""Sets the power state of the smart plug."""
        var packet = Buffer.alloc(16, 0);
        packet[0] = 2;
        packet[4] = state ? 1 : 0;
        this.sendPacket(0x6a, packet);

    }

    this.check_power = function() {
        //"""Returns the power state of the smart plug."""
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);

    }

    this.on("payload", (err, payload) => {
        logger.debug("sp2 payload..");
        var param = payload[0];
        switch (param) {
            case 1: //get from check_power
                var pwr = Boolean(payload[0x4]);
                this.emit("power", pwr);
                break;
            case 3:
                console.log('case 3');
                break;
            case 4:
                console.log('case 4');
                break;
        }

    });


}

device.prototype.a1 = function() {
    this.type = "A1";
    this.check_sensors = function() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
        /*
           err = response[0x22] | (response[0x23] << 8);
           if(err == 0){
           data = {};
           aes = AES.new(bytes(this.key), AES.MODE_CBC, bytes(self.iv));
           payload = aes.decrypt(bytes(response[0x38:]));
           if(type(payload[0x4]) == int){
           data['temperature'] = (payload[0x4] * 10 + payload[0x5]) / 10.0;
           data['humidity'] = (payload[0x6] * 10 + payload[0x7]) / 10.0;
           light = payload[0x8];
           air_quality = payload[0x0a];
           noise = payload[0xc];
           }else{
           data['temperature'] = (ord(payload[0x4]) * 10 + ord(payload[0x5])) / 10.0;
           data['humidity'] = (ord(payload[0x6]) * 10 + ord(payload[0x7])) / 10.0;
           light = ord(payload[0x8]);
           air_quality = ord(payload[0x0a]);
           noise = ord(payload[0xc]);
           }
           if(light == 0){
           data['light'] = 'dark';
           }else if(light == 1){
           data['light'] = 'dim';
           }else if(light == 2){
           data['light'] = 'normal';
           }else if(light == 3){
           data['light'] = 'bright';
           }else{
           data['light'] = 'unknown';
           }
           if(air_quality == 0){
           data['air_quality'] = 'excellent';
           }else if(air_quality == 1){
           data['air_quality'] = 'good';
           }else if(air_quality == 2){
           data['air_quality'] = 'normal';
           }else if(air_quality == 3){
           data['air_quality'] = 'bad';
           }else{
           data['air_quality'] = 'unknown';
           }
           if(noise == 0){
           data['noise'] = 'quiet';
           }else if(noise == 1){
           data['noise'] = 'normal';
           }else if(noise == 2){
           data['noise'] = 'noisy';
           }else{
           data['noise'] = 'unknown';
           }
           return data;
           }
           */
    }

    this.check_sensors_raw = function() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
        /*
           err = response[0x22] | (response[0x23] << 8);
           if(err == 0){
           data = {};
           aes = AES.new(bytes(this.key), AES.MODE_CBC, bytes(self.iv));
           payload = aes.decrypt(bytes(response[0x38:]));
           if(type(payload[0x4]) == int){
           data['temperature'] = (payload[0x4] * 10 + payload[0x5]) / 10.0;
           data['humidity'] = (payload[0x6] * 10 + payload[0x7]) / 10.0;
           data['light'] = payload[0x8];
           data['air_quality'] = payload[0x0a];
           data['noise'] = payload[0xc];
           }else{
           data['temperature'] = (ord(payload[0x4]) * 10 + ord(payload[0x5])) / 10.0;
           data['humidity'] = (ord(payload[0x6]) * 10 + ord(payload[0x7])) / 10.0;
           data['light'] = ord(payload[0x8]);
           data['air_quality'] = ord(payload[0x0a]);
           data['noise'] = ord(payload[0xc]);
           }
           return data;
           }
           */
    }

    this.on("payload", (err, payload) => {
        logger.debug("A1 payload..");
        

    });
}


device.prototype.rm = function() {
    this.type = "RM2";
    this.checkData = function() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 4;
        this.sendPacket(0x6a, packet);
    }

    this.sendData = function(data) {
        packet = new Buffer([0x02, 0x00, 0x00, 0x00]);
        packet = Buffer.concat([packet, data]);
        this.sendPacket(0x6a, packet);
    }

    this.cancelLearn = function() {
        packet = Buffer.alloc(16, 0);
        packet[0] = 0x1e;
        this.sendPacket(0x6a, packet);
    }

    this.enterLearning = function() {
        // console.log(">>>>>enterLearningenterLearning");        
        var packet = Buffer.alloc(16, 0);
        packet[0] = 3;
        this.sendPacket(0x6a, packet);
    }

    this.checkTemperature = function() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }

    // if(rmPlusDeviceTypes[parseInt(this.devtype, 16)]) {
        this.supportRF = true;
        this.enterRFSweep = () => {
          const packet = Buffer.alloc(16, 0);
          packet[0] = 0x19;
          this.sendPacket(0x6a, packet);
        }
    
        this.checkRFData = () => {
          const packet = Buffer.alloc(16, 0);
          packet[0] = 0x1a;
          this.sendPacket(0x6a, packet);
        }
    
        this.checkRFData2 = () => {
          const packet = Buffer.alloc(16, 0);
          packet[0] = 0x1b;
          this.sendPacket(0x6a, packet);
        }
    // }

    this.on("payload", (err, payload) => {
        var param = payload[0];
        switch (param) {
            case 1:
                var temp = (payload[0x4] * 10 + payload[0x5]) / 10.0;
                this.emit("temperature", temp);
                break;
            case 4: //get from check_data
                var data = Buffer.alloc(payload.length - 4, 0);
                payload.copy(data, 0, 4);
                this.emit("rawData", data);
                break;
            case 26://get from check_data
                var data = Buffer.alloc(1, 0);
                payload.copy(data, 0, 0x4);
                if (data[0] !== 0x1) break;
                this.emit('rawRFData', data);
                break;
            case 27://get from check_data
                var data = Buffer.alloc(1, 0);
                payload.copy(data, 0, 0x4);
                if (data[0] !== 0x1) break;
                this.emit('rawRFData2', data);
                break;
        }
    });
}


device.prototype.hysen = function() {
    this.type = "Hysen heating controller";
}

device.prototype.dooya = function() {
    this.type = "Dooya DT360E";
}

device.prototype.s1c = function() {
    this.type = "S1C";
}

// https://github.com/mjg59/python-broadlink/blob/master/broadlink/__init__.py

module.exports = {
    BroadlinkDM:BroadlinkDM,
    TCPCMD:TCPCMD
}