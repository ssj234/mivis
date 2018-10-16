
//@ sourceURL=mod.js
DeviceController.$inject = ['$scope', '$http', '$targets'];
function DeviceController($scope, $http, $targets) {

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

}