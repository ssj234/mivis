//@ sourceURL=mod.js
BroadlinkController.$inject = ['$scope', '$http', '$targets'];
function BroadlinkController($scope, $http, $targets) {

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

    $scope.loadDeviceList = function(cb,toptip){
        $http.get("miGatewayList").then(function(data){
            $scope.deviceList = data.data.alldev;
            $scope.hbDeviceList = data.data.hbdev;
            for(var index in $scope.deviceList){
                var mac = $scope.deviceList[index].mac;
                /*if($scope.unselected.indexOf(mac) == -1){
                    $scope.deviceList[index].checked = true;
                }else{
                    $scope.deviceList[index].checked = false;
                }*/

                if($scope.hbDeviceList.indexOf(mac) > -1){
                    $scope.deviceList[index].checked = true;
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

   

    $scope.addDevice=function(update){

        if(!update){ // add
            if(!$scope.configObject.mac){
                $.alert("请输入小米网关的mac地址",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
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

}
