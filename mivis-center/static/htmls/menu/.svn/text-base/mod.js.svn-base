menuController.$inject = ['$scope', '$http','$state'];
function menuController($scope, $http, $state){
	// 菜单切换效果
	(function () {
		$scope.open = function (idx) {
			$scope.$menuChange({type:1,id:idx}).$change();
		};
	})();
	$scope.tip="event.id";
	$scope.redirectTo=function(url){
		$scope.$body(url);
	}
	$scope.onChange=function(event){
		//alert(">>"+menu);
		if(event.type===1){
			$scope.selectedIdx = event.id;
		}else{
			$scope.tip=event.id;
			// $("#tip").
			$("#tip").animate({height:40}).show();
			$scope.$digest();
		}

	}

	$scope.close=function(){
		$("#tip").animate({height:0}).hide(100);
	}
}