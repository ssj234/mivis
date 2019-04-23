'use strict'
const HttpUtils = exports;
//引入request 模块
var request = require('request')

HttpUtils.postForm = function (url, form, callback) {
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

HttpUtils.postFormJson = function (url,form,callback) {
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
    if (!error && response.statusCode === 200) {
        callback({success: true, msg: body});
        console.log('request is success ');
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
// let param = {'user': 'username','pass': 'password'};
// HttpUtils.postForm('http://localhost:8080/springboot/params', param, function (result) {
//     console.log(result)
// });

// HttpUtils.postFormJson('http://localhost:8080/springboot/params', param, function (result) {
//     console.log(result)
// });