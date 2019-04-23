//@ sourceURL=mod.js
BroadlinkController.$inject = ['$scope', '$http', '$targets'];
function BroadlinkController($scope, $http, $targets) {

    $scope.configObject = {type:"rm",update:false};
    $scope.unselected = []; 
    $scope.selectedDevice = {};


    $scope.reloadDeviceList = function(){
        $scope.deviceList = {};
        $.toptip('刷新中...', 3000,'warning');
        // 发送信号，然后获取设备
        $http.get("broadlinkListRefresh").then(function(data){
            setTimeout(function(){
                // 重新加载
                $scope.loadDeviceList(null,true);
              },3000);
        });
    }

    // 加载空调品牌
	$scope.loadAirBrand = function(){
		if(!$scope.BLAirBrand){
			$http.post("/groupBrand",{
				brand:$scope.selectedBrand
				}).then(function(data){
				if(!data.data.error){
                    $scope.BLAirBrand = data.data.List;
                    if($scope.selectedDevice.brand){
                        scope.configObject.brand = $scope.selectedDevice.brand;
                    }
				}
			});
		}
    }
    $scope.loadAirBrand(); // 加载空调品牌

    $scope.loadBrandType = function(){
        // configObject.acBrand
        $http.post("/findBrand",{
			brand:$scope.configObject.acBrand
			}).then(function(data){
			if(!data.data.error){
                $scope.BLAirBrandTemplates = data.data.List;
                if($scope.selectedDevice.acBrandSeq){
                    for (var idx in $scope.BLAirBrandTemplates){
                        var  template = $scope.BLAirBrandTemplates[idx];
                        if(template.brandseq == $scope.selectedDevice.acBrandSeq){
                            $scope.configObject.acBrandType = template;
                            $scope.loadBrandTypeCode();
                        }
                    }
                }
			}else{
				alert('查询失败!');
			}
			try{$scope.$digest();}catch(e){}
		});
    }

    // 选择了型号
    $scope.loadBrandTypeCode = function(){
        console.log($scope.configObject.acBrandType);
        var code = JSON.parse($scope.configObject.acBrandType.code);
        $scope.configObject.data = code;
        $scope.configObject.acBrandSeq = $scope.configObject.acBrandType.brandseq;
    }

    $scope.test18 = function(){
        if(!$scope.configObject.mac){
            $.toast("请先输入mac地址！", "forbidden");
            return;
        }
        if(!$scope.configObject.acBrandType){
            $.toast("请先选择空调品牌和模板！", "forbidden");
            return;
        }
        var code = JSON.parse($scope.configObject.acBrandType.code);
        code = code.cool.temperature18;
        $scope.sendHex($scope.configObject.mac,code);
    }

    $scope.test25 = function(){
        if(!$scope.configObject.mac){
            $.toast("请先输入mac地址！", "forbidden");
            return;
        }
        if(!$scope.configObject.acBrandType){
            $.toast("请先选择空调品牌和模板！", "forbidden");
            return;
        }
        var code = JSON.parse($scope.configObject.acBrandType.code);
        code = code.auto.temperature25;
        $scope.sendHex($scope.configObject.mac,code);
    }

    $scope.test30 = function(){
        if(!$scope.configObject.mac){
            $.toast("请先输入mac地址！", "forbidden");
            return;
        }
        if(!$scope.configObject.acBrandType){
            $.toast("请先选择空调品牌和模板！", "forbidden");
            return;
        }
        var code = JSON.parse($scope.configObject.acBrandType.code);
        code = code.heat.temperature30;
        $scope.sendHex($scope.configObject.mac,code);
    }

    $scope.testClose = function(){
        if(!$scope.configObject.mac){
            $.toast("请先输入mac地址！", "forbidden");
            return;
        }
        if(!$scope.configObject.acBrandType){
            $.toast("请先选择空调品牌和模板！", "forbidden");
            return;
        }
        var code = JSON.parse($scope.configObject.acBrandType.code);
        code = code.off;
        $scope.sendHex($scope.configObject.mac,code);
    }

    

	$scope.selectTemplate = function($index){
		$scope.BLAirSelected = $scope.BLAirBrandTemplates[$index];
		$scope.BLAirBrandTemplateSelected = "模板:"+$scope.BLAirSelected.description;
		var code = JSON.parse($scope.BLAirSelected.code);
		$scope.configObject.test = {
			auto25:code.auto.temperature25,
			heat30:code.heat.temperature30,
			cool18:code.cool.temperature18,
			off:code.off
		}
	}

    

    $scope.add2Hb = function(){
        var ret = {"rm":[]};// 
        for(var index in $scope.deviceList){
            var dev = $scope.deviceList[index];
            if(dev.checked){
                if(!dev.acBrand || !dev.acBrandSeq || !dev.data ){
                    $.toast("未选择"+dev.mac+"的空调模板！", "forbidden");
                    return;
                }
                ret['rm'].push({mac:dev.mac,data:dev.data});
            }
        }
        if(ret['rm'].length == 0){
            $.toast("请先选择要添加的设备！", "forbidden");
            return;
        }

        $http({
            method:'post',  
            url:"blSave2Hb",  
            data:ret 
        }).success(function(req){  
            $.toast("已同步到homekit中！");
        })
    }

    $scope.updateLocal = function(){
        $scope.resetConfigObject(); // configObject是要配置的对象，先初始化一下
        $scope.configObject.mac = $scope.selectedDevice.mac;
        $scope.configObject.acBrand = $scope.selectedDevice.acBrand; // 品牌
        // $scope.configObject.acBrandType = $scope.selectedDevice.brandType; // 型号
        $scope.configObject.update= true;
        // 
        $("#addPopup").popup();
        $scope.loadBrandType();
    }

    $scope.deleteLocal = function(){
        // 只有不在线的设备才能被删除
        $.confirm("确定要删除吗？", function() {
            //点击确认后的回调函数
            $http({
                method:'post',  
                url:'broadlinkRemove',  
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
        $http.get("broadlinkList").then(function(data){
            $scope.deviceList = data.data.alldev; // 所有dev
            $scope.hbDeviceList = data.data.hbdev; // homebridge中的dev
            for(var index in $scope.deviceList){
                var mac = $scope.deviceList[index].mac;
                
                if($scope.hbDeviceList.indexOf(mac) > -1){ // 在hb中
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
        $scope.configObject = {type:"rm",update:false};
    }

    function macInList(mac){
        var ret = $scope.deviceList[$scope.configObject.mac];
        if(ret){
            return true;
        }
        return false;
    }

    // 添加和修改设备
    $scope.addDevice=function(update){

        if(!update){ // add
            if(!$scope.configObject.mac){
                $.alert("请输入RM的mac地址",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
        
              if(macInList($scope.configObject.mac)){ // 
                $.alert("RM的mac地址已经存在",function(){
                  $("#gw_mac").focus();
                });
                return;
              }
        }
          if(!$scope.configObject.acBrand){
            $.alert("请选择空调品牌",function(){
              
            });
            return;
          }

          if(!$scope.configObject.acBrandType){
            $.alert("请选择空调模板",function(){
              
            });
            return;
          }

          // add
        var url = "broadlinkAdd";
        if(update){
            url = "broadlinkUpdate";
        }
        delete $scope.configObject["acBrandType"];
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
