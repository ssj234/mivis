angular.module('ux.other', []).value('ux.other', {});
/*jshint smarttabs:true, eqeqeq:false, eqnull:true, laxbreak:true*/
/**
 * @author
 * filter template
 * 大写金额转换
 */
(function(window, angular){
	function amount() {
		return function(input) {
			if (input !== undefined) {
				var strOutput = "", strUnit = '仟佰拾亿仟佰拾万仟佰拾元角分';
				input += "00";
				var intPos = input.indexOf('.');
				if (intPos >= 0){
					input = input.substring(0, intPos) + input.substr(intPos + 1, 2);
				}
				strUnit = strUnit.substr(strUnit.length - input.length);
				for (var i = 0; i < input.length; i++) {
					strOutput += '零壹贰叁肆伍陆柒捌玖'.substr(input.substr(i, 1), 1) + strUnit.substr(i, 1);
				}
				return strOutput
								.replace(/^零角零分$/, '')
								.replace(/零角零分$/, '整')
								.replace(/^零元零角/, '')
								.replace(/零[仟佰拾]/g, '零')
								.replace(/零{2,}/g, '零')
								.replace(/零([亿|万])/g, '$1')
								.replace(/零+元/, '元')
								.replace(/亿零{0,3}万/, '亿')
								.replace(/^元/, "零元")
								.replace(/零角/, '零')
								.replace(/零元/, '')
								.replace(/零分$/,"");
			}
			return input;
		};
	}
	angular.module('ux.other').filter('amount', amount);
})(window, angular);
(function(window, angular, userAgent) {
	'use strict';

	//用于帮助处理传入的属性、判断是否监听
	//例如 attr="i am a string"
	//attr="i am a {{type}}"  $scope.type='string'
	//attr="name" $scope.name="angular";
    function uxAttrHelperProvider(){
        this.attribute=undefined;
        this.$get=["$interpolate",function($interpolate){
            return {
            	//arguments:$scope,element,attr,key
            	//key is CamelCase
            	//return prop:原始内容 
                parse:function(args,key){
                	var ret={},snakeCase,camelCase,$scope=args[0],element=args[1],attr=args[2];
                	if(!key)return;
                	camelCase=key;
                	snakeCase=key.replace(/([A-Z])/g,"-$1").toLowerCase();
                	ret.prop=element.attr(snakeCase);// defined by user
                	ret.show=ret.content=attr[camelCase];// parsed content
                	if($scope.hasOwnProperty(ret.content)){//property
                        ret.show=$scope.$eval(ret.content);
                    }
                    ret.$scope=$scope;
                    this.attribute=ret;
                    return this;
                },
                change:function(fn){
                	var $scope;
                	var attribute=this.attribute;
                	if(!attribute||!attribute.show||!attribute.prop)return;
                	$scope=attribute.$scope;
                	
                    //若 attr='name' ==> 'lilei'
                    if(attribute.show!==attribute.content){
                    	$scope.$watch(function(){
                        	return $scope.$eval(attribute.content);
                    	},fn);
                    	//fn(attribute.show);
                    }else if(attribute.prop.indexOf($interpolate.startSymbol())>-1&&
                    	attribute.prop.indexOf($interpolate.endSymbol())>-1){
                    	$scope.$watch(function(){
                        	return $interpolate(attribute.prop)($scope);
                    	},fn);
                    	
                    }else{
                    	fn(attribute.show);
                    }
                    
                }

            }
        }]
    }
	
	angular.module('ux.other')
    .provider({
        uxAttrHelper:uxAttrHelperProvider
    });

})(window, angular,navigator.userAgent);
(function(window, angular, userAgent) {
	'use strict';

	uxBindDirectDirective.$inject=['$interpolate','uxAttrHelper'];
    function uxBindDirectDirective($interpolate,uxAttrHelper){
            return {
                restrict : 'A',
                scope:false,//
                template:'',
                priority:1,
                link:function($scope,element,attr){
                    element.text(attr.uxBindDirect);
                    // var uxAttr=uxAttrHelper.parse(arguments,"uxBindDirect");
                    // //属性修改后
                    // uxAttr.change(function(v){
                    //     element.text(v);
                    // });
                }
            }
    };
	angular.module('ux.other').directive("uxBindDirect",uxBindDirectDirective);

})(window, angular,navigator.userAgent);
(function(window, angular) {
    'use strict';
    /**与ngBindHtml需要$sce.trustAsHtml(text)后的html
    *  并且加入了watch，
    * 绑定html一般都是只需要一次，不发生变化，因此重写一个
    */
    uxBindHtmlDirective.$inject=['$interpolate'];
    function uxBindHtmlDirective($interpolate){
            return {
                restrict : 'A',
                scope:false,//
                link:function($scope,element,attr){
                	var html=$scope.$eval(attr.uxBindHtml);
                    element.html(html);
                }
            }
    };
    angular.module('ux.other').directive("uxBindHtml",uxBindHtmlDirective);

})(window, angular);
(function (window,angular){
	'use strict';
	var mod = angular.module('ux.other');
	mod.directive("uxClearbtn",[function(){
		return {
			restrict:'A',
			link: function(scope, element, attr){
				element.bind('click',function(){
					var curNode = angular.element('#'+attr.uxClearbtn);
					var myScope = curNode.scope();
					var vModel=curNode.attr("ng-model");
					myScope[vModel] = '';
					curNode.val('');
					scope.$apply();
				});
			}
		};
	}]);

	
})(window,angular);
/**
 * 用于全局作用域中缓存数据
 * */
(function(window, angular) {'use strict';
	function ContextProvider(){
		this.$get = ["$cacheFactory", function($cacheFactory){
			var cmbcCache = $cacheFactory("cmbcContext",{capacity:30});
			return{
				setData : function(key,value){
					cmbcCache.put(key,value);
				},
				getData : function(key){
					return cmbcCache.get(key);
				},
				clearData : function(key) {
					cmbcCache.remove(key);
				}
			};
		}];
	};
	
	angular.module('ux.other').provider("$context",ContextProvider);
	
})(window, window.angular);
/**
 * 倒计时
 * @auther 
 */

(function(window,angular){
	'use strict';
	
	var mod = angular.module("ux.other");
	
	/*
	 * @doc directive 倒计时
	 * <v-count-down></v-count-down>
	 * @param end-date 结束时间（毫秒数）
	 * @param startinterval 等于1时启动倒计时
	 */
	mod.directive("uxCountDown",["$parse",function($parse){
		return {
			restrict:"E",
			template:'<span class="count-down-box"><b>{{int_hour}}</b>时<b>{{int_minute}}</b>分<b>{{int_second}}</b>秒</span>',
			replace:true,
			link:function(scope,element,attr){
				var endDate=attr.enddate.replace(/-/g,'/'),//结束时间毫秒数
					time_end=new Date(endDate).getTime(),//结束时间
					flag=0,
					fn = $parse(attr.callback),
					time_now;//服务器当前时间
				scope.$watch(attr.startinterval,function(value){
					if(value=="1"){
//						$remote(angular.element("#content"), false).post(trsContext + "timestamp.do", {"FromUserName":FromUserName}, function(data) {
							time_now = new Date().getTime();
							var interval=setInterval(function(){
								time_now += 1000;
								var time_distance=time_end-time_now;//时间差：活动结束时间减去当前时间
								if(time_distance >= 0){
									scope.int_day = Math.floor(time_distance/86400000);
								    // 相减的差数换算成小时
								    scope.int_hour = parseInt(time_distance/(3600*1000));
								    scope.int_minute = parseInt(time_distance%(3600*1000)/(60*1000));
								    scope.int_second = parseInt((time_distance/1000)- scope.int_hour*3600-scope.int_minute*60);
								    scope.int_hour = scope.int_hour < 10 ? '0'+scope.int_hour : scope.int_hour;
								    scope.int_minute =  scope.int_minute < 10 ? '0'+ scope.int_minute :  scope.int_minute;
								    scope.int_second =  scope.int_second < 10 ? '0'+ scope.int_second :  scope.int_second;
								    scope.$apply();
								}else{
									fn(scope);
									clearInterval(interval);
								}
							},1000);
							scope.$on("$destroy",function(){
								clearInterval(interval);
							});
//						});
					}
				});
			}
		};
	}])
	
})(window,angular);
/*jshint smarttabs:true, eqeqeq:false, eqnull:true, laxbreak:true*/
(function(window, angular, undefined) {'use strict';
	var service = {};
	service.dateUtil = ['$filter','$http',
	function($filter,$http) {
		return {
			/**
	         * description:还回时间格式类似为"2012-05-16"字符串, format指定字符串格式， 默认yyyy-MM-dd。
	         * example:getDate()还回当前时间的，getDate("3d")三天前时间，getDate("3w")三周前的，getDate("3m")三个月前的
	         * 	+3d 三天后时间	+3w三周后时间	+3m三月后时间
	         */
			getDate : function(days, format, timestamp) {
				// TODO 添加函数过程
				format = format || 'yyyy-MM-dd';
				var date = timestamp ? new Date(timestamp) : new Date();
				if (days) {
					var group = days.match(/(\+?)(\d+)([dDMmWw])/);
					var symbol=group[1], value = Number(group[2]), type = group[3].toUpperCase();
					if (type === 'D'){
						var time = symbol ? date.getTime() + (value * 24 * 3600 * 1000) : date.getTime() - (value * 24 * 3600 * 1000);
						return $filter('date')(time, format);
					}else if (type === 'W'){
						var time = symbol ? date.getTime() + (value * 7 * 24 * 3600 * 1000) : date.getTime() - (value * 7 * 24 * 3600 * 1000);
						return $filter('date')(time, format);
					}else if (type === 'M') {
						symbol ? date.setMonth(date.getMonth() + value) : date.setMonth(date.getMonth() - value);
						return $filter('date')(date, format);
					}
				} else{
					return $filter('date')(date, format);
				}
			},
			/**
			 * 获取服务器当前时间*/
			getServerDate:function(callback,days,format){
				var self = this;
				$rootScope.post2SRV("timestamp.json",null,function(data){
					callback(self.getDate(days,format,data.Timestamp));
				},function(){
					callback(self.getDate(days,format));
				});
			},
			daysBetween: function(beginDate,endDate){
				var OneMonth = beginDate.substring(5,beginDate.lastIndexOf ('-'));  
				var OneDay = beginDate.substring(beginDate.length,beginDate.lastIndexOf ('-')+1);  
				var OneYear = beginDate.substring(0,beginDate.indexOf ('-'));  
				var TwoMonth = endDate.substring(5,endDate.lastIndexOf ('-'));  
				var TwoDay = endDate.substring(endDate.length,endDate.lastIndexOf ('-')+1);  
				var TwoYear = endDate.substring(0,endDate.indexOf ('-'));  
				var difference=((Date.parse(TwoMonth+'/'+TwoDay+'/'+TwoYear)- Date.parse(OneMonth+'/'+OneDay+'/'+OneYear))/86400000);
				return difference;
			}
		};
	}];
	angular.module('ux.other').service(service);
})(window, window.angular);
/*jshint smarttabs:true, eqeqeq:false, eqnull:true, laxbreak:true*/
/**
 * @author
 * filter 加密账号    1234****5678
 */
(function(window, angular) {'use strict';

	function encryptAcNo() {
		return function(input) {
			if(input !== undefined)
				return input.substring(0,4) + "****" + input.substring(input.length-4);
		}
	}

	angular.module('ux.other').filter('encryptAcNo', encryptAcNo);

})(window, angular);
/*
 * 格式化日期: yyyy年mm月dd日
 */
(function(window, angular) {'use strict';

function formatDateLocal() {
	return function(input, ch, chnew) {
		if(input !== undefined){
			switch(arguments.length) {
				case 1 : return input.replace("-","年").replace("-","月") + "日"; break;
				case 2 : return input.replace(ch,"-").replace(ch,"-"); break;
				case 3 : return input.replace(ch, chnew).replace(ch, chnew); break;
			}
		}
		return input;
	};
}
angular.module('ux.other').filter('formatDateLocal', formatDateLocal);

})(window, angular);
(function(window, angular, userAgent) {
	'use strict';

    function uxImageProvider(){
        var src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC",
        server="";
        //设置图片服务器地址
        this.server=function(ser){
            server=(ser||"").replace(/(http|https):\/\//,'');
        }
        //设置默认图像
        this.defaultSrc=function(_src){
            _src&&(src=_src);
            return src;
        }
        //获取图像地址
        function getUrl(img){
             if(img.indexOf('data:image')==0)return img;
             var protocol='https:'==document.location.protocol?'https://':'http://';
             var newUrl= server?(protocol+server+img):img;
             return newUrl+(angular.curVersion?("?v="+angular.curVersion):"");
        }

        this.$get=function(){
            return {
                server:server,
                defaultSrc:src,
                getUrl:getUrl
            }
        }
    }
    //默认延迟加载
	uxImageDirective.$inject=['uxImageServer','uxAttrHelper','uxScroll'];
    function uxImageDirective(uxImageServer,uxAttrHelper,uxScroll){
            function setSrc(v,element,thisDomian){
                var url=thisDomian?v:(uxImageServer.getUrl(v));
                if(element[0].nodeName=="IMG"){//若为<img>标签
                    element[0].src=url;
                }else{//设置背景
                    var old=element.css("background");
                    var bg = "url('" + url + "')" ;
                    bg=old.replace(/url.*\)/,bg);
                    element.css("background" , bg);
                }
            }
            return {
                restrict : 'A',
                scope:false,
                template:'',
                link:function($scope,element,attr){
                    //设置默认图片
                    var lazy=!attr.hasOwnProperty('notlazy'),
                    thisDomian=attr.hasOwnProperty('self'),
                    helper=uxAttrHelper.parse(arguments,"uxImage");
                    setSrc(lazy?uxImageServer.defaultSrc:helper.attribute.show,element,thisDomian);
                
                    helper.change(function(v){
                        //如果在可视范围了则加载
                        if(lazy){//fix one version,scroll慢
                            uxScroll.one(element,function(){
                                setSrc(v,element,thisDomian);
                            },lazy);
                        }    
                    });
                    
                }
            }
    };
	angular.module('ux.other')
    .directive("uxImage",uxImageDirective)
    .provider({
        uxImageServer:uxImageProvider
    });

})(window, angular,navigator.userAgent);
(function(window, angular, userAgent) {
	'use strict';
	
	var service = {};
	service.$os = [ function() {
		var os = {
			webkit : userAgent.match(/WebKit\/([\d.]+)/) ? true : false,
			android : userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) ? true : false,
			androidICS : this.android && userAgent.match(/(Android)\s4/) ? true : false,
			ipad : userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false,
			iphone : !(userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false) && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false,
			ios : (userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false) || (!(userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false) && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false),
			wphone : userAgent.match(/Windows Phone/i)?true:false
		};
		return os;
	} ];

	angular.module('ux.other').service(service);

})(window, angular,navigator.userAgent);
(function(window, angular, userAgent) {
	'use strict';

	uxPlaceholderDirective.$inject=['$interpolate','uxAttrHelper'];
    function uxPlaceholderDirective($interpolate,uxAttrHelper){
            return {
                restrict : 'A',
                scope:false,//
                template:'',
                link:function($scope,element,attr){
                    var uxAttr,span;
                    uxAttr=uxAttrHelper.parse(arguments,"uxPlaceholder");
                    //添加元素
                    element.wrap("<span style='position:relative;display: inline-block'></span>");
                    element.parent().append("<span style='overflow: hidden;"
                        +"white-space: nowrap;margin-left: 5px;color:#999999;padding-left: 5px;position:absolute;top:0px;left:0px;right:0px;bottom:0px;line-height:1.5em;box-sizing:content-box;' class='ng-placeholder-span'></span>");
                    span=element.next();
                    span.css("fontSize",element.css("fontSize"));
                    
                    span.height(element.outerHeight()+"px");
                    span.click(function(){
                        element.focus();
                    });
                    element.keyup(function(e){
                        element.val()?span.hide():span.show();
                    });
                    //属性修改后
                    uxAttr.change(function(v){
                        span.text(v);
                    });
                }
            }
    };
	angular.module('ux.other').directive("uxPlaceholder",uxPlaceholderDirective);

})(window, angular,navigator.userAgent);
(function(window, angular, userAgent) {
	'use strict';

	uxPostlinkDirective.$inject=['$interpolate'];
    function uxPostlinkDirective($interpolate){
            return {
                restrict : 'A',
                scope:false,//
                template:'',
                priority:-1,
                compile:function(element,attr){
                    return {
                        post:function($scope,element,attr){
                            if(((!attr.ngRepeat)||(attr.ngRepeat&&$scope.$last==true))&&attr.uxPostlink){
                                $scope.$eval(attr.uxPostlink);                           
                            }
                        }
                    }
                }
            }
    };
	angular.module('ux.other').directive("uxPostlink",uxPostlinkDirective);

})(window, angular,navigator.userAgent);
(function(window, angular){
	'use strict';
	
	var mod = angular.module("ux.other");
	
	mod.directive("uxProgress", [function(){
		return{
			restrict:"EA",
			replace:false,
			link:function(scope,element,attr){
				element.find(".progress_fg").css("width",(attr.curprogress||"0")+"%");
				element.find(".progress_tipbubble").css("left",(attr.curprogress||"0")+"%");
			}
		};
	}]);
	
})(window, angular);
(function(window, angular, userAgent) {
	'use strict';

    //用于处理
    function uxScrollProvider(){
        
        var els=[];//保存所有dom元素，里面为对象{id:'id1',el:dom,callback:cb}
        var _window=$(window);
        var threshold=20;//阀值
        this.threshold=function(_data){
            _data&&(threshold=_data);
            return threshold;
        }
        //参数为el元素,jQuery对象，回调函数，是否判断可视（不判断则立即回调）
        function scroll(el,cb,visible){
            if(!el instanceof angular.element){
                el=angular.element(el);
            }
            var obj={el:el,cb:cb,vis:visible,index:els.length};
            els.push(obj);
            _window.trigger("scroll",obj);
        }
        function one(el,cb,visible){
            if(!el instanceof angular.element){
                el=angular.element(el);
            }
            var obj={el:el,cb:cb,vis:visible,one:true,index:els.length};
            els.push(obj);
            _window.trigger("scroll",obj);
        }

        //是否在可视范围内
        function isVisible(el){

            var pos=el[0].getBoundingClientRect(),
            windowHeight=_window.height(),
            windowWidth=_window.width();
            if((pos.top+threshold)<=windowHeight&&(pos.left+threshold)<=windowWidth){
                return true;
            }
            return false;
        }

        this.$get=["$window",function($window){

            _window.scroll(function(e,data) {
                //data 是trigger时传过来的，避免每次遍历数组
                //index是trigger时数据在数组中的index，负责forEach中的i一直会是0
               data=data&&[data];
               var array=data||els;
               angular.forEach(array,function(obj,i){
                    if(!obj)return;
                    if(obj.index!==undefined)i=obj.index;
                    //console.log("scroll >>>"+ i);
                    //若已经被删除则清理
                    if(!obj.el||(obj.el.height()===0&&obj.el.width()===0)){
                        els[i]=null;
                    }
                    if(!obj.vis||(obj.vis&&isVisible(obj.el))){
                        obj.cb();
                        obj.one&&(els[i]=null);
                    }
               });
                
            });

            return {
                scroll:scroll,
                one:one,
                go:function(top){
                    top=top||0;
                    window.document.body.scrollTop=top;
                }
            }
        }];
    }
	
	angular.module('ux.other')
    .provider({
        uxScroll:uxScrollProvider
    });
    //$window

})(window, angular,navigator.userAgent);