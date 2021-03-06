
//@ sourceURL=mod.js
DeviceController.$inject = ['$scope', '$http', '$targets','$interval'];
function DeviceController($scope, $http, $targets,$interval) {
    $scope.runningShow = "获取中...";
    $scope.existShow = "获取中...";
    $scope.rebootHB = function(){
        $.confirm("确定要重启网桥吗？", function() {
          $http.get("rebootHB").then(function(data){
            $.toast("操作成功,请等待重启");
          });
        });
      }

      $scope.delCache =function(){
        $.alert("删除缓存可能造成<家庭>中已经添加的设备不可用，请谨慎删除！",function(){
          $.confirm("确定要删除缓存吗？删除后需要重启网桥后重新添加！", function() {
            $http.get("delCache").then(function(data){
              $.toast("操作成功,重启网桥后重新添加！");
            });
          });
        });
        
      }

      $scope.reboot = function(){
        $.confirm("确定要重启设备吗？重启后该页面暂时不可用！", function() {
          $http.get("reboot").then(function(data){
            $.toast("操作成功,请等待重启！");
          },function(){
            $.toast("操作失败！");
          });
        });
    }

    $scope.frpc = function(){
      $.confirm("确定要启动远程协助吗？启动请先联系技术支持人员！", function() {
        $http.get("remoteHelp").then(function(data){
          $.toast("启动成功！");
        },function(){
          $.toast("启动失败！");
        });
      });
    }

    $scope.getShairplay = function(){
      $http.get("getShairplay").then(function(data){
        var exist = data.data.exist;
        if(exist){
          $scope.existShow = "投射IP";
        }else{
          $scope.existShow = "不投射IP";
        }
      },function(){
        $.toast("切换失败！");
      });
    }
    $scope.shairplay = function(){
      $.confirm("确定要切换投射IP的方式吗，将在重启后生效！", function() {
        $http.get("shairplay").then(function(data){
          var exist = data.data.exist;
          if(exist){
            $scope.existShow = "不投射IP";
          }else{
            $scope.existShow = "投射IP";
          }
        },function(){
          $.toast("切换失败！");
        });
      });
    }

    $scope.getShairplay();


    /*$scope.drawQRCode = function(){
      $http.get("qrcode").then(function(data){
        
        data = data.data;
        var code =  data.code;
        if(code){
          $("#qrcodePopup").popup();
          $scope.code = data.code;
          $("#qrcode").empty();
          $("#qrcode").qrcode({
            render: "table", //table方式
            width: 200, //宽度
            height:200, //高度
            text: code //任意内容
          });
        }else{
          $scope.codeShow = false;
        }
        $scope.code = code|| "未能获取到Homebridge的信息";
      });
    }
    $scope.drawQRCode();*/


    

    function getStatus(){
      $.get("runstatus",function(data){ // 获取config文件内容
        $scope.running = data.status;
        $scope.runningShow = data.status?"运行中":"未运行";
        $scope.pinCode = data.pinCode;
      })
    }
    $scope.handler = $interval(getStatus,3000);
    getStatus();


    $scope.$on("$destroy",function(){
      if($scope.handler){
        $interval.cancel($scope.handler);
        $scope.handler = null;
      }
    })
}