var HttpUtil = require("../HttpUtil");
HttpUtil.postForm("http://www.baidu.com",{},function(rep){
   if(rep.success){
       console.log("success");
   }else{
        console.log("failed");
   }
})