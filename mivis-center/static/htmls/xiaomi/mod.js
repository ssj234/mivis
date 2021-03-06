//@ sourceURL=mod.js
XiaomiController.$inject = ['$scope', '$http', '$targets'];
function XiaomiController($scope, $http, $targets) {

    $scope.configObject = {type:"gw",update:false};
    $scope.unselected = []; 
    $scope.selectedDevice = {};

    function getMac(obj){
        for(var mac in obj){
            return mac;
        }
        return undefined;
    }

    $scope.add2Hb = function(){
        var ret = {"gw":[]};// 
        for(var index in $scope.deviceList){
            var dev = $scope.deviceList[index];
            if(dev.checked){
                if(!dev.token){
                    $.toast("未设置"+dev.mac+"的密钥！", "forbidden");
                    return;
                }
                ret['gw'].push({mac:dev.mac,token:dev.token});
            }
        }
        if(ret['gw'].length == 0){
            $.toast("请先选择要添加的设备！", "forbidden");
            return;
        }

        $http({
            method:'post',  
            url:"miSave2Hb",  
            data:ret 
        }).success(function(req){  
            $.toast("已同步到homekit中！");
        })
    }

    $scope.updateLocal = function(){
        $scope.resetConfigObject();
        $scope.configObject.mac = $scope.selectedDevice.mac;
        $scope.configObject.token = $scope.selectedDevice.token;
        $scope.configObject.update= true;
        $("#addPopup").popup();
        $("#gw_token").focus();
    }

    $scope.deleteLocal = function(){
        // 只有不在线的设备才能被删除
        $.confirm("确定要删除吗？", function() {
            //点击确认后的回调函数
            $http({
                method:'post',  
                url:'miGatewayRemove',  
                data:$scope.selectedDevice 
            }).success(function(req){  
                $scope.loadDeviceList();
                $("#half").trigger('click');
            })
        }, function() {
            //点击取消后的回调函数
        });
    }
    // 下方的菜单
    $scope.openMenu = function(device){
        $scope.selectedDevice = device;
        $("#half").popup();
        $("#half").css("display","block");
    }
    $scope.toggleChecked = function(dev,$event){
        dev.checked = !dev.checked;
        if(dev.checked){ // 选择
            var idx = $scope.unselected.indexOf(dev.mac);
            if(idx > -1){
                $scope.unselected.splice(idx);
            }
        }else{ // 未选
            $scope.unselected.push(dev.mac);
        }
        $event.stopPropagation();
    }
    // 刷新
    $scope.reloadDeviceList = function(){
        $scope.deviceList = {};
        $.toptip('刷新中...', 3000,'warning');
        // 发送信号，然后获取设备
        $http.get("miGatewayListRefresh").then(function(data){
            setTimeout(function(){
                // 重新加载
                $scope.loadDeviceList(null,true);
              },3000);
        });
    }
    // 获取设备列表
    $scope.loadDeviceList = function(cb,toptip){
        $http.get("miGatewayList").then(function(data){
            $scope.deviceList = data.data.alldev;
            $scope.hbDeviceList = data.data.hbdev;
            for(var index in $scope.deviceList){
                var dev_tmp = $scope.deviceList[index];
                var mac = $scope.deviceList[index].mac;
                /*if($scope.unselected.indexOf(mac) == -1){
                    $scope.deviceList[index].checked = true;
                }else{
                    $scope.deviceList[index].checked = false;
                }*/

                if($scope.hbDeviceList.indexOf(mac) > -1){
                    $scope.deviceList[index].checked = true;
                }
                if(dev_tmp.model){
                    if(dev_tmp.model.indexOf('gateway') > -1){
                        dev_tmp.ctrlLight = true;
                    }
                }
            }
            try{$scope.$digest();}catch(e){};
            if(cb){
                cb();
            }
            if(toptip){
                $.toptip('刷新成功', 'success');
            }
            $("#closePopupBtm").trigger('click');
        });
    }
    $scope.loadDeviceList();
    
    $scope.addLocal=function(){
        $scope.resetConfigObject();
        $("#addPopup").popup();
        $("#gw_mac").focus();
    }

    $scope.addLocalCancel = function(){
        $scope.resetConfigObject();
    }

    $scope.resetConfigObject = function(){
        $scope.configObject = {type:"gw",update:false};
    }

    function macInList(mac){
        var ret = $scope.deviceList[$scope.configObject.mac];
        if(ret){
            return true;
        }
        return false;
    }

   $scope.subDevices = function(){
        $scope.selectedDevice.subDevs = [];
        $http({
            method:'post',  
            url:"miSubDevices",  
            data:$scope.selectedDevice 
        }).success(function(req){  
            $scope.selectedDevice.subDevs = req.subDevs;
            try{$scope.$digest();}catch(e){};
            $("#subDevPopup").popup();

        })
   }

    $scope.addDevice=function(update){

        if(!update){ // add
            if(!$scope.configObject.mac){
                $.alert("请输入小米网关的mac地址",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
              $scope.configObject.mac = $scope.configObject.mac.toLowerCase();
              if(!/([a-fA-F0-9]{2}){5}[a-fA-F0-9]{2}/.test($scope.configObject.mac)){
                $.alert("mac地址的格式不正确",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
              if(macInList($scope.configObject.mac)){ // 
                $.alert("网关mac地址已经存在",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
        }
          if(!$scope.configObject.token){
            $.alert("请输入小米网关的局域网密钥",function(){
              $("#gw_token").focus();
            });
            return;
          }
  
          if(!/^[0-9a-zA-Z]{16}$/.test($scope.configObject.token)){
            $.alert("局域网密钥的格式不正确",function(){
              $("#gw_token").focus();
            });
            return;
          }
  
          
          // add
        var url = "miGatewayAdd";
        if(update){
            url = "miGatewayUpdate";
        }
        $http({
            method:'post',  
            url:url,  
            data:$scope.configObject 
        }).success(function(req){  
            $scope.loadDeviceList();
            $scope.resetConfigObject();
            $("#closePopup").trigger('click');
        })

    }

    $scope.openGWLight = function(dev_in){
        var dev = dev_in || $scope.selectedDevice;
        if(!dev.token){
            $.alert("未设置密钥，请先设置!",function(){});
            return;
        }

        $http({
            method:'post',  
            url:"openGWLight",  
            data:dev
        }).success(function(req){  
            $.toptip('已开灯！','success');
            // $("#closePopup").trigger('click');
        })
    }

    $scope.closeGWLight = function(dev_in){
        var dev = dev_in || $scope.selectedDevice;
        if(!dev.token){
            $.alert("未设置密钥，请先设置!",function(){});
            return;
        }

        $http({
            method:'post',  
            url:"closeGWLight",  
            data:dev
        }).success(function(req){  
            $.toptip('已关灯！','warning');
            // $("#closePopup").trigger('click');
        })
    }

    $scope.joinDevice = function(open){
        var dev = $scope.selectedDevice;
        dev.joinOpen = open || false;
        if(!dev.token){
            $.alert("未设置密钥，请先设置!",function(){});
            return;
        }

        $http({
            method:'post',  
            url:"joinDevice",  
            data:dev
        }).success(function(req){  
            $.toptip((open ? '允许连入子设备！' : '停止连入子设备！'),(open ? 'success':'warning'));
            // $("#closePopup").trigger('click');
        })
    }


    $scope.showMiAcpTutor = function(){
        $scope.pbAcp = $.photoBrowser({
          items: [
            
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/b1.jpg",
              caption: "点击右上角<...>的圆圈  [向左滑动]"
            },
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/b2.jpg",
              caption: "点击<关于>  [向左滑动]"
            },
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/b3.jpg",
              caption: "在底部空白处快速点击，出现开发者选项  [向左滑动]"
            },
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/a5.png",
              caption: "局域网通信协议中需要打开协议并查看密码，网关信息中查看mac地址  [向左滑动]"
            },
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/a6.png",
              caption: "局域网通信协议需要打开协议并记录密码  [向左滑动]"
            },
            {
              image: "http://web.uxiaowo.com/sirivis/tutor/a7.png",
              caption: "网关信息中查看mac地址  [向左滑动]"
            }
          ]
        });
        $scope.pbAcp.open();
      }

}
