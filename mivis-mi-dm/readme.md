# 使用

```
var MIUtil = require("../index");

var mi = new MIUtil();
// 发送广播，获取网关响应
mi.sendWhoisCommand();
// 获取所有网关
mi.getAllGateways();
// 获取所有设备
mi.getAllDevices();
// 获取某个网管下的设备
mi.getAllDevices("7811dce1b453");
// 打开小夜灯
mi.gwControlLight("7811dce1b453",true,"3F6A8D809374400A");
```

```
{"7c49eb82b2c6":{"sid":"7c49eb82b2c6","passwd":"none","ip":"192.168.1.33","port":"9898","proto_version":"2.0.1","model":"acpartner.v3","token":"RTMKh0pIuEhfviRX"},"7811dce1b453":{"sid":"7811dce1b453","passwd":"none","ip":"192.168.1.20","port":"9898","proto_version":"1.1.2","model":"gateway","token":"PwghPIvlpigGphUv"}}
```

```
[{"sid":"158d000237d4aa","gatewaySid":"7c49eb82b2c6","model":"plug","lastUpdateTime":1539609047562},{"sid":"158d000211a037","gatewaySid":"7811dce1b453","model":"motion","lastUpdateTime":1539609047565}]
```
