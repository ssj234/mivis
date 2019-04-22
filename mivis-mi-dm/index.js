const dgram = require('dgram');
const crypto = require('crypto');

const fs = require('fs');
const path=require('path');

// const express = require('express');
// const session = require("express-session");
// const bodyParser = require('body-parser');

const packageFile = require("./package.json");
const LogUtil = require('./lib/LogUtil');
const ConfigUtil = require('./lib/ConfigUtil');
const GatewayUtil = require('./lib/GatewayUtil');
const DeviceUtil = require('./lib/DeviceUtil');
const AccessoryUtil = require('./lib/AccessoryUtil');
const ParseUtil = require('./lib/ParseUtil');

const iv = Buffer.from([0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58, 0x56, 0x2e]);

const serverAqaraLANProtocolSocket = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true
});
const serverAqaraLANProtocolMulticastAddress = '224.0.0.50';
const serverAqaraLANProtocolMulticastPort = 4321;
const serverAqaraLANProtocolServerPort = 9898;

// const MivisRuntime = require('./runtime/index')

function initRuntime(mi){
    // var mivis = new MivisRuntime();
    mi.Accessory = null;
    mi.PlatformAccessory = null;
    mi.Service = null;
    mi.Characteristic = null;
    mi.UUIDGen = null;
}

function MiAqaraPlatform() {
    
    initRuntime(this);
    // Initialize
    var fileConfig = {};
    this.log = new LogUtil(null, console);
    this.ConfigUtil = new ConfigUtil(fileConfig);
    this.GatewayUtil = new GatewayUtil();
    this.DeviceUtil = new DeviceUtil();
    this.AccessoryUtil = new AccessoryUtil();
    this.ParseUtil = new ParseUtil(this);

    this._promises = {};
    this.initServerAqaraLANProtocol();
}

MiAqaraPlatform.prototype.sendWhoisCommand = function() {
    var that = this;
    var whoisCommand = '{"cmd": "whois"}';
    that.log.debug("[Send]" + whoisCommand);
    this.GatewayUtil.removeAll();
    this.DeviceUtil.removeAll();
    serverAqaraLANProtocolSocket.send(whoisCommand, 0, whoisCommand.length, serverAqaraLANProtocolMulticastPort, serverAqaraLANProtocolMulticastAddress);
}

MiAqaraPlatform.prototype.initServerAqaraLANProtocol = function() {
    var that = this;
    
    // err - Error object, https://nodejs.org/api/errors.html
    serverAqaraLANProtocolSocket.on('error', (err) => {
        that.log.error('error, msg - %s, stack - %s\n', err.message, err.stack);
    });
    
    serverAqaraLANProtocolSocket.on('listening', () => {
        if (null == that.ConfigUtil.getBindAddress()) {
            serverAqaraLANProtocolSocket.addMembership(serverAqaraLANProtocolMulticastAddress);
        } else {
            serverAqaraLANProtocolSocket.setMulticastInterface(that.ConfigUtil.getBindAddress());
            serverAqaraLANProtocolSocket.addMembership(serverAqaraLANProtocolMulticastAddress, that.ConfigUtil.getBindAddress());
        }
        that.log.info("Aqara LAN protocol server is listening on port: " + serverAqaraLANProtocolServerPort);
    });
    serverAqaraLANProtocolSocket.on('message', this.parseMessage.bind(this));

    serverAqaraLANProtocolSocket.bind(serverAqaraLANProtocolServerPort);
}


MiAqaraPlatform.prototype.parseMessage = function(msg, rinfo){
    var that = this;

//  that.log.debug(msg);
    var jsonObj;
    try {
        jsonObj = JSON.parse(msg);
    } catch (ex) {
        that.log.error("Bad msg: " + msg);
        return;
    }
    
    var cmd = jsonObj['cmd'];
    if (cmd === 'iam' || cmd === 'virtual_iam') {
        that.log.debug("[Revc]" + msg);
        var gatewaySid = jsonObj['sid'];
        if(true) { // 返回iam的只有网关
            /*if(that.ConfigUtil.isHostGateway(gatewaySid) && cmd != 'virtual_iam') {
                return;
            }*/
            
            var gateway = that.GatewayUtil.getBySid(gatewaySid);
            if(!gateway) {
                // add gateway
                // that.ConfigUtil.getGatewayPasswordByGatewaySid(gatewaySid)
                // 暂时不设置密码，控制设备时需要提供
                gateway = {
                    sid: gatewaySid,
                    passwd: "none",
                    ip: jsonObj['ip'], // rinfo.address,
                    port: jsonObj['port'] // rinfo.port,
                }
                gateway = that.GatewayUtil.addOrUpdate(gatewaySid, gateway);
            
                // add device
                if(!that.DeviceUtil.getBySid(gatewaySid)) {
                    var gatewayDevice = {
                        sid: gatewaySid,
                        gatewaySid: gatewaySid,
                        lastUpdateTime: Date.now()
                    }
                    that.DeviceUtil.addOrUpdate(gatewaySid, gatewayDevice);
                    
                    var command1 = '{"cmd":"read", "sid":"' + gatewaySid + '"}';
                    that.sendReadCommand(gatewaySid, command1, {timeout: 0.5 * 60 * 1000, retryCount: 12}).then(result => {
                        that.DeviceUtil.addOrUpdate(result['sid'], {model: result['model']});
                        
                        var createAccessories = that.ParseUtil.getCreateAccessories(result);
                        that.registerPlatformAccessories(createAccessories);
                        // 执行相应的动作
                        that.ParseUtil.parserAccessories(result);
                        // that.deleteDisableAccessories(result['sid'], result['model']);
                        
                        // set gateway proto_version
                        var proto_version = null;
                        try {
                            if('read_ack' === result['cmd']) {
                                var data = result['data'];
                                proto_version = data && JSON.parse(data)['proto_version'];
                            } else if('read_rsp' === result['cmd']) {
                                var params = result['params'];
                                if(params) {
                                    for(var i in params) {
                                        if(params[i]['proto_version']) {
                                            proto_version = params[i]['proto_version'];
                                            break;
                                        }
                                    }
                                }
                            } else {
                            }
                            
                            gateway = that.GatewayUtil.addOrUpdate(gatewaySid, {
                                proto_version: proto_version,
                                model: result['model']
                            });
                            
                            // send list cmd
                            var listCmd = that.getCmdListByProtoVersion(proto_version);
                            if(listCmd) {
                                that.log.debug("[Send]" + listCmd);
                                serverAqaraLANProtocolSocket.send(listCmd, 0, listCmd.length, jsonObj['port'], jsonObj['ip']);
                            }
                        } catch(e) {
                            that.log.debug(e);
                        }
                    }).catch(function(err) {
                        that.DeviceUtil.remove(gatewaySid);
                        that.log.error(err);
                    });
                } 
            } else {
                // send list cmd
                var proto_version = gateway['proto_version'];
                var listCmd = that.getCmdListByProtoVersion(proto_version);
                if(listCmd) {
                    that.log.debug("[Send]" + listCmd);
                    serverAqaraLANProtocolSocket.send(listCmd, 0, listCmd.length, jsonObj['port'], jsonObj['ip']);
                }
            }
        }
    } else if (cmd === 'get_id_list_ack' || cmd === 'discovery_rsp') {
        that.log.debug("[Revc]" + msg);
        var gatewaySid = jsonObj['sid'];
        
        // update gateway token
        var gateway = that.GatewayUtil.getBySid(gatewaySid);
        if(gateway) {
            that.GatewayUtil.addOrUpdate(gatewaySid, {token: jsonObj['token']});
        
            // add gateway sub device
            var deviceSids = that.getDeviceListByJsonObj(jsonObj, gateway.proto_version);
            var index = 0;
            var sendInterval = setInterval(() => {
                if(index >= deviceSids.length) {
                    that.log.debug("read gateway(" + gatewaySid + ") device list finished. size: " + index);
                    clearInterval(sendInterval);
                    return;
                }
                
                var deviceSid = deviceSids[index];
                if(!that.DeviceUtil.getBySid(deviceSid)) {
                    var device = {
                        sid: deviceSid,
                        gatewaySid: gatewaySid,
                        model: jsonObj['model'],
                        lastUpdateTime: Date.now()
                    }
                    that.DeviceUtil.addOrUpdate(deviceSid, device);
                }
                
                var command2 = '{"cmd":"read", "sid":"' + deviceSid + '"}';
                that.sendReadCommand(deviceSid, command2, {timeout: 3 * 1000, retryCount: 12}).then(result => {
                    that.DeviceUtil.addOrUpdate(result['sid'], {model: result['model']});
                    var createAccessories = that.ParseUtil.getCreateAccessories(result);
                    that.registerPlatformAccessories(createAccessories);
                    that.ParseUtil.parserAccessories(result);
                    
                    // that.deleteDisableAccessories(result['sid'], result['model']);
                }).catch(function(err) {
                    that.DeviceUtil.remove(deviceSid);
                    that.log.error(err);
                });
                
                index++;
            }, 50);
        }
    } else if (cmd === 'heartbeat') {
//      that.log.debug("[Revc]" + msg);
        var model = jsonObj['model'];
        var sid = jsonObj['sid'];
        
        if (that.ParseUtil.isGatewayModel(model)) {
            that.GatewayUtil.update(sid, {token: jsonObj['token']});
        }

        var device = that.DeviceUtil.getBySid(sid);
        if(device) {
            var newLastUpdateTime = Date.now();
//          that.log.debug("update device: " + sid + ", lastUpdateTime " + device.lastUpdateTime + " to " + newLastUpdateTime);
            that.DeviceUtil.update(sid, {lastUpdateTime: newLastUpdateTime});
            // if(!that.ParseUtil.isGatewayModel(model) && (jsonObj['data'] || jsonObj['params'])) {
            //     that.ParseUtil.parserAccessories(jsonObj);
            // }
        } else {
        }
    } else if (cmd === 'write_ack' || cmd === 'write_rsp') {
        var msgTag = 'write_' + jsonObj['sid'];
        const p = that.getPromises(msgTag);
        if(!p) {
            that.log.warn("[Revc]" + msg);
            return;
        } else {
            that.log.debug("[Revc]" + msg);
            if(jsonObj['data'] && jsonObj['data'].indexOf('error') > -1) {
                p.reject(new Error(JSON.parse(jsonObj['data'])['error']));
            } else if(jsonObj['data'] && jsonObj['data'].indexOf('\"unknown\"') > -1 && jsonObj['data'].indexOf('\"on\"') == -1 && jsonObj['data'].indexOf('\"off\"') == -1) {
                p.reject(new Error(jsonObj['data']));
            } else {
                p.resolve(jsonObj);
            }
        }
    } else if (cmd === 'read_ack' || cmd === 'read_rsp') {
        var msgTag = 'read_' + jsonObj['sid'];
        const p = that.getPromises(msgTag);
        if(!p) {
            that.log.warn("[Revc]" + msg);
            return;
        } else {
            that.log.debug("[Revc]" + msg);
            if(jsonObj['data'] && jsonObj['data'].indexOf('error') > -1) {
                p.reject(new Error(JSON.parse(jsonObj['data'])['error']));
            // } else if(jsonObj['data'] && jsonObj['data'].indexOf('unknown') > -1) {
                // p.reject(new Error(jsonObj['data']));
            } else {
                p.resolve(jsonObj);
            }
        }
    } else if (cmd === 'report') {
        that.log.debug("[Revc]" + msg);
        that.ParseUtil.parserAccessories(jsonObj);

        /*var sid = jsonObj['sid'];
        var device = that.DeviceUtil.getBySid(sid);
        if(device) {
            var newLastUpdateTime = Date.now();
//          that.log.debug("update device: " + sid + ", lastUpdateTime " + device.lastUpdateTime + " to " + newLastUpdateTime);
            that.DeviceUtil.update(sid, {lastUpdateTime: newLastUpdateTime});
        } else {
        }*/
    } else {
        that.log.warn("[Revc]" + msg);
    }
}

MiAqaraPlatform.prototype.getProtoVersionPrefixByProtoVersion = function(proto_version) {
    if(proto_version) {
        var dotIndex = proto_version.indexOf('.');
        if(dotIndex > 0) {
            return proto_version.substring(0, dotIndex);
        }
    }
    
    return null;
}

MiAqaraPlatform.prototype.getCmdListByProtoVersion = function(proto_version) {
    var listCmd = null;
    var proto_version_prefix = this.getProtoVersionPrefixByProtoVersion(proto_version);
    if(1 == proto_version_prefix) {
        listCmd = '{"cmd":"get_id_list"}';
    } else if(2 == proto_version_prefix) {
        listCmd = '{"cmd":"discovery"}';
    } else {
    }
    
    return listCmd;
}

MiAqaraPlatform.prototype.getDeviceListByJsonObj = function(jsonObj, proto_version) {
    var deviceList = [];
    var proto_version_prefix = this.getProtoVersionPrefixByProtoVersion(proto_version);
    if(1 == proto_version_prefix) {
        deviceList = JSON.parse(jsonObj['data']);
    } else if(2 == proto_version_prefix) {
        for(var i in jsonObj['dev_list']) {
            deviceList.push(jsonObj['dev_list'][i]['sid']);
        }
    } else {
    }
    
    return deviceList;
}

MiAqaraPlatform.prototype.getDeviceProtoVersionBySid = function(sid) {
    var that = this;
    var device = that.DeviceUtil.getBySid(sid);
    if(device) {
        var gateway = that.GatewayUtil.getBySid(device.gatewaySid);
        if(gateway) {
            return gateway.proto_version;
        }
    }
    
    return null;
}

MiAqaraPlatform.prototype.getDeviceModelBySid = function(sid) {
    var that = this;
    var device = that.DeviceUtil.getBySid(sid);
    if(device) {
        return device.model;
    }
    
    return null;
}

MiAqaraPlatform.prototype.getPromises = function(msgTag) {
    var resultTag = null;
    for(var promisesTag in this._promises) {
        if(promisesTag.indexOf(msgTag) > -1) {
            if(null == resultTag || Number(resultTag.slice(resultTag.indexOf('_t')+2)) > Number(promisesTag.slice(promisesTag.indexOf('_t')+2))) {
                resultTag = promisesTag;
            }
        }
    }
    return this._promises[resultTag];
}

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

MiAqaraPlatform.prototype.getPromisesTagSerialNumber = function() {
    if(null == this.PromisesTagSerialNumber) {
        this.PromisesTagSerialNumber = {
            time: new Date().Format("yyyyMMddhhmmss"),
            num: 0
        }
    } else {
        if(new Date().Format("yyyyMMddhhmmss") != this.PromisesTagSerialNumber.time) {
            this.PromisesTagSerialNumber.time = new Date().Format("yyyyMMddhhmmss");
            this.PromisesTagSerialNumber.num = 0;
        }
    }
    return this.PromisesTagSerialNumber.time + (this.PromisesTagSerialNumber.num++);
}

MiAqaraPlatform.prototype.sendCommand = function(ip, port, msgTag, msg, options) {
    var that = this;
    return new Promise((resolve, reject) => {
        if(!that.PromisesSendCommand) {
            that.PromisesSendCommand = {};
        }
        
        const triggerCorrelationPromises = (fun, res) => {
            var promisesSendCommands = that.PromisesSendCommand[ip + port + msg];
            if(promisesSendCommands) {
                promisesSendCommands = promisesSendCommands.concat();
                delete that.PromisesSendCommand[ip + port + msg];
                promisesSendCommands.forEach(function(promisesSendCommand, index, arr) {
                    const p = that._promises[promisesSendCommand];
                    if(p) {
                        p[fun](res);
                    }
                });
            }
        }
        
        let retryLeft = (options && options.retryCount) || 3;
        const send = () => {
            retryLeft --;
            that.log.debug("[Send]" + msg);
            serverAqaraLANProtocolSocket.send(msg, 0, msg.length, port, ip, err => err && reject(err));
        }
        const _sendTimeout = setInterval(() => {
            if(retryLeft > 0) {
                send();
            } else {
                clearInterval(_sendTimeout);
                delete that._promises[msgTag];
                var err = new Error('timeout: ' + msg);
                triggerCorrelationPromises('reject', err);
                reject(err);
            }
        }, (options && options.timeout) || 1 * 1000);
            
        that._promises[msgTag] = {
            resolve: res => {
                clearInterval(_sendTimeout);
                delete that._promises[msgTag];
                triggerCorrelationPromises('resolve', res);
                resolve(res);
            },
            reject: err => {
                clearInterval(_sendTimeout);
                delete that._promises[msgTag];
                triggerCorrelationPromises('reject', err);
                reject(err);
            }
        };
        
        if(that.PromisesSendCommand[ip + port + msg]) {
            that.PromisesSendCommand[ip + port + msg].push(msgTag);
        } else {
            that.PromisesSendCommand[ip + port + msg] = [];
            send();
        }
    })
}

MiAqaraPlatform.prototype.sendReadCommand = function(deviceSid, command, options) {
    var that = this;
    return new Promise((resolve, reject) => {
        var device = that.DeviceUtil.getBySid(deviceSid);
        var gateway = that.GatewayUtil.getBySid(device.gatewaySid);
        var msgTag = 'read_' + deviceSid + "_t" + that.getPromisesTagSerialNumber();
        that.sendCommand(gateway.ip, gateway.port, msgTag, command, options).then(result => {
            resolve(result);
        }).catch(function(err) {
            // that.log.error(err);
            reject(err);
        });
    })
}

MiAqaraPlatform.prototype.sendWriteCommand = function(deviceSid, command, options) {
    var that = this;
    return new Promise((resolve, reject) => {
        var device = that.DeviceUtil.getBySid(deviceSid);
        var gateway = that.GatewayUtil.getBySid(device.gatewaySid);
        
        var cipher = crypto.createCipheriv('aes-128-cbc', that.ConfigUtil.getGatewayPasswordByGatewaySid(gateway['sid']), iv);
        var gatewayToken = gateway['token'];
        var key = cipher.update(gatewayToken, "ascii", "hex");
        cipher.final('hex'); // Useless data, don't know why yet.
        
        command = command.replace('${key}', key);
        var msgTag = 'write_' + deviceSid + "_t" + that.getPromisesTagSerialNumber();
        that.sendCommand(gateway.ip, gateway.port, msgTag, command, options).then(result => {
            resolve(result);
        }).catch(function(err) {
            // that.log.error(err);
            reject(err);
        });
    })
}

MiAqaraPlatform.prototype.sendWriteCommandWithoutFeedback = function(deviceSid,password, command, options) {
    var that = this;
    var device = that.DeviceUtil.getBySid(deviceSid);
    var gateway = that.GatewayUtil.getBySid(device.gatewaySid);
    var passwd = password; // that.ConfigUtil.getGatewayPasswordByGatewaySid(gateway['sid']) || options.password;
    var cipher = crypto.createCipheriv('aes-128-cbc', passwd, iv);
    var gatewayToken = gateway['token'];
    var key = cipher.update(gatewayToken, "ascii", "hex");
    cipher.final('hex'); // Useless data, don't know why yet.
    
    command = command.replace('${key}', key);
    that.log.debug("[Send]" + command);
    serverAqaraLANProtocolSocket.send(command, 0, command.length, gateway.port, gateway.ip, err => err && reject(err));
}

MiAqaraPlatform.prototype.hsb2rgb = function(hsb) {
    var rgb = [];
    //先令饱和度和亮度为100%，调节色相h
    for(var offset=240,i=0;i<3;i++,offset-=120) {
        //算出色相h的值和三个区域中心点(即0°，120°和240°)相差多少，然后根据坐标图按分段函数算出rgb。但因为色环展开后，红色区域的中心点是0°同时也是360°，不好算，索性将三个区域的中心点都向右平移到240°再计算比较方便
        var x=Math.abs((hsb[0]+offset)%360-240);
        //如果相差小于60°则为255
        if(x<=60) rgb[i]=255;
        //如果相差在60°和120°之间，
        else if(60<x && x<120) rgb[i]=((1-(x-60)/60)*255);
        //如果相差大于120°则为0
        else rgb[i]=0;
    }
    //在调节饱和度s
    for(var i=0;i<3;i++)
        rgb[i]+=(255-rgb[i])*(1-hsb[1]);
    //最后调节亮度b
    for(var i=0;i<3;i++)
        rgb[i]*=hsb[2];
    // 取整
    for(var i=0;i<3;i++)
        rgb[i]=Math.round(rgb[i]);
    return rgb;
}
MiAqaraPlatform.prototype.dec2hex = function(dec, len) {
    var hex = "";
    while(dec) {
        var last = dec & 15;
        hex = String.fromCharCode(((last>9)?55:48)+last) + hex;
        dec >>= 4;
    }
    if(len) {
        while(hex.length < len) hex = '0' + hex;
    }
    return hex;
}
MiAqaraPlatform.prototype.gwControlLight = function(deviceSid,power,password) {
    var prepValue = 0,hue = 0,saturation = 0 * 100,brightness = 50;
    if(power) {
        var rgb = this.hsb2rgb([hue, saturation/100, 1]);
        prepValue = parseInt(this.dec2hex(brightness, 2) + this.dec2hex(rgb[0], 2) + this.dec2hex(rgb[1], 2) + this.dec2hex(rgb[2], 2), 16);
    }
    var command = '{"cmd":"write","model":"gateway","sid":"' + deviceSid + '","data":"{\\"rgb\\":' + prepValue + ', \\"key\\": \\"${key}\\"}"}';
    this.sendWriteCommandWithoutFeedback(deviceSid,password,command,{password:password});
}

MiAqaraPlatform.prototype.joinDevice = function(deviceSid,value,password) {
    var device = this.DeviceUtil.getBySid(deviceSid);
    var command = '{"cmd":"write","model":"' + device.model + '","sid":"' + device.sid + '","params":[{"join_permission":"' + (value ? 'yes' : 'no') + '"}], "key": "${key}"}';
    this.sendWriteCommandWithoutFeedback(deviceSid,password,command,{password:password});
}

MiAqaraPlatform.prototype.acPower = function(deviceSid,value,password) {
    var device = this.DeviceUtil.getBySid(deviceSid);
    var command = '{"cmd":"write","model":"' + device.model + '","sid":"' + device.sid + '","params":[{"on_off_cfg":"on"}], "key": "${key}"}';
    this.sendWriteCommandWithoutFeedback(deviceSid,password,command,{password:password});
}

MiAqaraPlatform.prototype.getAllGateways = function() {
    return this.GatewayUtil.getAll();
}

MiAqaraPlatform.prototype.getAllDevices = function(gateway) {
    var devices =  this.DeviceUtil.getAll();

    var ret = [];
    for(var sid in devices){
        if(sid == devices[sid].gatewaySid){ // 这是gateway
            continue;
        }else{ // 子设备
            if((gateway === undefined) || (devices[sid].gatewaySid == gateway) ){
                ret.push(devices[sid]);
            }
        }
    }
    return ret;
}


MiAqaraPlatform.prototype.registerPlatformAccessories = function(accessories) {
    /*var that = this;
    that.api.registerPlatformAccessories("homebridge-mi-aqara", "MiAqaraPlatform", accessories);
    accessories.forEach(function(accessory, index, arr) {
        that.log.info("create accessory - UUID: " + accessory.UUID);
        that.AccessoryUtil.add(accessory);
    });*/
}

MiAqaraPlatform.prototype.unregisterPlatformAccessories = function(accessories) {
    /*var that = this;
    that.api.unregisterPlatformAccessories("homebridge-mi-aqara", "MiAqaraPlatform", accessories);
    accessories.forEach(function(accessory, index, arr) {
        that.log.info("delete accessory - UUID: " + accessory.UUID);
        that.AccessoryUtil.remove(accessory.UUID);
    });*/
}

module.exports = MiAqaraPlatform;