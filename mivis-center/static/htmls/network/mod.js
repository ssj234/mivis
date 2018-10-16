NetworkController

//@ sourceURL=mod.js
NetworkController.$inject = ['$scope', '$http', '$targets'];
function NetworkController($scope, $http, $targets) {
    $scope.devInfo = function(){
        $.get("devInfo",function(data){ // 获取config文件内容
          $scope.devIp = data.ip; // 文件中的配置
          $scope.devMac = data.mac;
          try{$scope.$digest();}catch(e){};
        });
      }
    $scope.devInfo();

    $scope.wifiStatus = function(){
        $http.get("wifiStatus").then(function(data){
          if(data.data){
            $scope.wifis = data.data;
            $scope.devWifi = "已连接";
          }
          var ssid;
          for(var idx in $scope.wifis){
            var tmp = $scope.wifis[idx].ssid;
            if(tmp){
              ssid = tmp;
            }
          }
          if($scope.wifis.length==0 || !ssid ){
            $scope.devWifi = "未连接";
          }else{
            $scope.devWifi = "已连接："+ssid;
          }
          try{$scope.$digest();}catch(e){};
        });
      }

      $scope.wifiStatus();

      $scope.wifiInfo = function(){
        $http.get("wifiInfo").then(function(data){
          if(data.data.ssid){
            $scope.wifi_ssid = data.data.ssid;
            // $("#ssid").val($scope.ssid);
          }
          if(data.data.psk){
            $scope.wifi_psk = data.data.psk;
            // $("#psk").val($scope.psk);
          }
          
          try{$scope.$digest();}catch(e){};
        });
      }

      $scope.wifiInfo();

      $scope.updateWifi = function(){
        $.confirm("确定要修改wifi吗？修改后需要重启网络才能生效！", function() {
            $http.post("/wifiSet",{ssid:$scope.wifi_ssid,psk:$scope.wifi_psk}).then(function(data){
              if(data.data.success){
                $.toast('修改成功!');
              }else{
                $.toast('修改失败!',"forbidden");
                $scope.wifiInfo();
              }
            });

          }, function() {
          //点击取消后的回调函数
          });
        
      }

      $scope.rebootWifi = function(){
        $.confirm("确定要重新启动网络吗？重启网络将导致页面暂时不可用！", function() {
          $http.get("wifiRestart").then(function(data){
          });
        });

      }
}