//主模块
var routeApp = angular.module('main', ["ux.core","ux.other"]);
routeApp.config(["$stateProvider","$urlRouterProvider","$controllerProvider", "$compileProvider", "$filterProvider", "$provide","$locationProvider",
	function($stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide,$locationProvider) {
	console.log("routeApp.config...");
	
	routeApp.register = {
	     controller: $controllerProvider.register,
	     directive: $compileProvider.directive,
	     filter: $filterProvider.register,
	     factory: $provide.factory,
	     service: $provide.service,
	     state: $stateProvider.state
	};
	$locationProvider.html5Mode(false);

}]);
//配置动态载入的模块
routeApp.config(["$ocLazyLoadProvider",function($ocLazyLoadProvider){
	$ocLazyLoadProvider.config({
    	debug:true
  	});
  	//uxImageServerProvider.server('http://www.baidu.com/');
}]);
//配置autoStateProvider
routeApp.config(["$stateProvider","$urlRouterProvider","$autoStateProvider","uxLazyLoaderProvider",
	function ($stateProvider, $urlRouterProvider,$autoStateProvider,uxLazyLoaderProvider) {
	//默认的配置，均未匹配时，载入/PageTab--->PageTab.html
	$autoStateProvider.setViewSize(2);
	$autoStateProvider.setRoot("htmls/");
	$autoStateProvider.setVersion(angular.curVersion);
	/**
	 * - 0 使用Javascript原生方法加载javascript文件
	 * - 1 使用$ocLazyLoad服务的load方法加载javascript文件
	 */
	uxLazyLoaderProvider.setLoaderMode(1);
	//设置是否激活国际化
	$autoStateProvider.setEnabledI18n(false);

	/**
	 *	根据url地址转向相应的页面
	 */
	$autoStateProvider.setStateInitCallback(['$location','$rootScope',function($location,$scope){
		var params=$location.search(),urlState=params.state,pg=params.pg||"mod";
		 if(!urlState){
		 	return true;//默认goto state
		 }else{
			 try{
			 	$scope.$body(urlState+'/'+pg,params,{location:false});
				return false;//不转向默认state
			 }catch(e){
				return true;//默认goto state
			 }
		 }
		return true;//默认goto state
	}]);
}]);
//启动函数
$(document).ready(function(){
	angular.bootstrap($('body'),['main']);
});

//配置模块，不会压缩的方式
routeApp.config(["$autoStateProvider",function ($autoStateProvider){
	//配置需要动态加载的模块
	$autoStateProvider.config({

    });
}]);

routeApp.run(["$rootScope","$http", function ($rootScope,$http) {
     
      $rootScope.gwtypes = {
		"gateway":"网关",
		"gateway.v3":"网关",
		"switch":"按钮开关",
		"sensor_switch":"按钮开关",
        "plug":"插座",
        "motion":"人体传感器",
		"magnet":"门磁传感器",
		"sensor_magnet":"门磁传感器",
        "sensor_ht":"温度湿度传感器",
        "ctrl_neutral1":"单按钮墙壁开关",
        "ctrl_neutral2":"双按钮墙壁开关",
        "ctrl_ln1":"单按钮墙壁开关零火版",
		"ctrl_ln2":"双按钮墙壁开关零火版",
		"ctrl_ln1.aq1":"单按钮墙壁开关零火版",
		"ctrl_ln2.aq1":"双按钮墙壁开关零火版",
        "86sw1":"86型无线单按钮开关",
		"86sw2":"86型无线双按钮开关",
		"sensor_86sw1.aq1":"86型无线单按钮开关",
		"sensor_86sw2.aq1":"86型无线双按钮开关",
		"sensor_86sw1":"86型无线单按钮开关",
        "sensor_86sw2":"86型无线双按钮开关",
		"86plug":"86型墙插",
		"ctrl_86plug":"86型墙插",
        "ctrl_86plug.aq1":"86型墙插-AQ1",
		"cube":"魔方",
		"sensor_cube":"魔方",
		"sensor_cube.aqgl01":"魔方",
		"smoke":"烟雾警报器",
		"sensor_smoke":"烟雾警报器",
		"natgas":"天然气警报器",
		"sensor_natgas":"天然气警报器",
        "curtain":"电动窗帘",
        "sensor_magnet.aq2":"第二代门磁感应",
        "sensor_motion.aq2":"第二代人体感应",
		"sensor_switch.aq2":"第二代按钮",
		"sensor_switch.aq3":"第三代按钮",
		"weather.v1":"第二代温度湿度传感器",
		"weather":"第二代温度湿度传感器",
		"sensor_wleak.aq1":"水浸传感器",
		"lock.aq1":"门锁",
		"acpartner.v3":"空调伴侣升级版",
		"remote.b286acn01":"86型无线双按钮开关升级版"
	  };
	  
	  // sned data
	  $rootScope.sendHex = function(mac,data){
		if(!mac){
			mac = $rootScope.learndRMMac;
		}
		if(!mac){
			$.toast("mac地址不能为空！", "forbidden");
			return;
		}
		// var data = scope.$eval(model);
		$http.post("/BLSendData",{mac:mac,data:data}).success(function(data){
			$.toptip('发送成功！','success');
		});
	}

}]).filter("gwtype",["$rootScope",function($rootScope) {
	return function (input) {
	var ret = $rootScope.gwtypes[input];
	return ret||"未知类型";
	}
}]);
	
// {name: "博联", url: "broadlink",img:"icon_nav_button.png",count:0},
angular.module("main").value("menu", [
	{name: "小米", url: "xiaomi",img:"icon_nav_button.png",count:0},
	{name: "博联", url: "broadlink",img:"icon_nav_button.png",count:0},
	{name: "wifi设置", url: "network",img:"icon_nav_button.png",count:0},
	{name: "设备管理",url: "device",img:"icon_nav_button.png",count:0}
]).run(["$rootScope", "menu", function ($rootScope, menu) {
	$rootScope.uxzoomMenu = menu;
}]);