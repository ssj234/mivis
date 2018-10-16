'use strict'
//引入request 模块
var request = require('request')

function postForm(url, form, callback) {
    let header = getHeader();
    let option = {
        json: true,
        header : header,
        body: form
    };
    request.post(url,option, function (error, response, body) {
        resultFunction(callback,error,response,body);
    })
};

function postFormJson(url,form,callback) {
    let header = getHeader();
    let option = {
        url: url,
        method: "POST",
        json: true,
        headers: header,
        body: form
    };
    request(option,function (error, response, body) {
        resultFunction(callback,error,response,body);
    });
};

function resultFunction(callback,error, response, body){
    if (!error && (response.statusCode === 200 || response.statusCode === 302)) {
        callback({success: true, msg: body});
    } else {
        console.log('request is error', error);
        callback({success: false, msg: error});
    }
}

function getHeader() {
    return {
        "Content-type": "application/json; charset=UTF-8",
        "Accept": "application/json; charset=UTF-8"
    };
}


module.exports = {
    postForm:postForm,
    postFormJson:postFormJson
}