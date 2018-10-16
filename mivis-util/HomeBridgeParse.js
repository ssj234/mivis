var request = require("request");
var mapping = require("./HKMap");

function HomeBridgeParse(url,pincode){
    if(url.endsWith("/")){
        url = url.substring(0,url.length-1);
    }
    this.url = url;
    this.pincode = pincode;
    this.getAllUrl = this.url +"/accessories";
    this.rwUrl = this.url +"/characteristics";
}

function resultFunction(callback,error, response, body){
    if (!error && (response.statusCode === 200 || response.statusCode === 302)) {
        callback({success: true, msg: body});
    } else {
        console.log('request is error', error);
        callback({success: false, msg: error});
    }
}
HomeBridgeParse.prototype.getHeader = function(){
    return {
        "Content-type": "application/json; charset=UTF-8",
        "Accept": "application/json; charset=UTF-8",
        "authorization":this.pincode
    };
}

function findServices(acc){
    var ret = [];
    // all service
    for(var index in acc.services){
        var service = acc.services[index];
        var serviceName = mapping.UUID2Service[service.type];
        if(serviceName){
            var service_new = {type:serviceName,chars:{}};
            for(var idx in service.characteristics){
                var char_tmp = service.characteristics[idx];
                var char_tmp_name = mapping.UUID2Characteristic[char_tmp.type];
                if(char_tmp_name){
                    // 设置服务的chars
                    service_new.chars[char_tmp_name] = {iid:char_tmp.iid,value:char_tmp.value,description:char_tmp.description};
                }
            }
            ret.push(service_new);
        }
    }
    return ret;
}
function handleAccessory(hkret){
    var accessories = hkret.accessories;
    var ret = [];
    for(var index in accessories){ // hb的返回
        var acc = accessories[index];
        var newAcc = {aid:acc.aid};
        newAcc.services = findServices(acc);
        ret.push(newAcc);
    }
    return ret;
}

HomeBridgeParse.prototype.hbAccessories = function(callback) {
    let header = this.getHeader();
    let option = {
        url: this.getAllUrl,
        method: "GET",
        json: true,
        headers: header
    };
    request(option,function (error, response, body) {
        body = handleAccessory(body);
        resultFunction(callback,error,response,body);
    });
};


function handleGetStatus(hkret){
    var chars = hkret.characteristics;
    var ret = {};
    for(var index in chars){ // hb的返回
        var char = chars[index];
        ret[char['aid']+'-'+char['iid']] = char; 
    }
    return ret;
}

HomeBridgeParse.prototype.hbGetStatus = function(ids,callback) {
    let header = this.getHeader();
    let option = {
        url: this.rwUrl+"?id="+ids,
        method: "GET",
        json: true,
        headers: header
    };
    request(option,function (error, response, body) {
        body = handleGetStatus(body);
        resultFunction(callback,error,response,body);
    });
};


HomeBridgeParse.prototype.hbSetStatus = function(body,callback) {
    let header = this.getHeader();
    let option = {
        url: this.rwUrl+"/characteristics",
        method: "PUT",
        json: true,
        headers: header,
        body:JSON.stringify(body)
    };
    request(option,function (error, response, body) {
        resultFunction(callback,error,response,body);
    });
};

module.exports = HomeBridgeParse