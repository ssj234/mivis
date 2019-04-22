
let closeClient = null;
let isClosingClient = false;
let timeout = null;
let getDataTimeout = null;
let getDataTimeout2 = null;
let getDataTimeout3 = null;

let currentDevice
let status = "init";
let started = false;
function log(param){
  console.log("[scanRF]>>>>>>>>>>>>>>>>>>>",param);
  status = param;
}
const getStatus = () =>{
  return status;
}

const stop = (device) => {
  // Reset existing learn requests
  started = false;
  if (!closeClient || isClosingClient) return;

  isClosingClient = true;

  if (currentDevice) currentDevice.cancelLearn();

  // setTimeout(() => {
    closeClient();
    closeClient = null;
    isClosingClient = false;

    log("[INFO]Scan RF (stopped) for start");
  // }, 500)
}

const start = (device, callback, turnOffCallback, disableTimeout) => {
  var host = device.mac;
  if(started){ // 如果已经开始了就返回
    return;
  }
  if(started === undefined){ // 为了能够在undefinde的时候返回###一次 
    started = false;
    return;
  }
  stop()
   started = true;
  // Get the Broadlink device
  // const device = getDevice({ host, log, learnOnly: true })
  if (!device) {
    callback("Error");
    started = false;
    return;
  }
  if (!device.enterLearning) {
    callback("Error");
    started = false;    
    return log("###Learn Code (IR learning not supported for device at)"+ host);
  }
  if (!device.enterRFSweep){ 
    callback("Error");
    started = false;    
    return log("###Scan RF (RF learning not supported for device at )"+host);
  }  
  currentDevice = device

  let onRawData;
  let onRawData2;
  let onRawData3;

  closeClient = (err) => {
    if (timeout) clearTimeout(timeout);
    timeout = null;

    if (getDataTimeout) clearTimeout(getDataTimeout);
    getDataTimeout = null;

    if (getDataTimeout2) clearTimeout(getDataTimeout2);
    getDataTimeout2 = null;

    if (getDataTimeout3) clearTimeout(getDataTimeout3);
    getDataTimeout2 = null;


    device.removeListener('rawRFData', onRawData);
    device.removeListener('rawRFData2', onRawData2);
    device.removeListener('rawData', onRawData3);
  };

  onRawData = (message) => {
    // log("[1/3] (onRawData) -- step1");
    if (!closeClient) return;
    // log("[1/3] (onRawData) -- step2");
    if (getDataTimeout) clearTimeout(getDataTimeout);
    getDataTimeout = null;

    // log("[1/3]已经发现扫频信号");//Scan RF (found frequency - 1 of 2)
    /*if (device.devtype === 0x279d || device.devtype === 0x27a9) { // 这两个设备进入学习，其他的直接找data2了
      return device.enterLearning();
    }*/
    device.enterLearning();
    log("[1/3]已发现，请按住<按钮>并保持!");//Keep holding that button!

    getDataTimeout2 = setTimeout(() => {
      getData2(device);
    }, 1000);
  };

  onRawData2 = (message) => {
    // log("[2/3] (onRawData2) -- step1");
    if (!closeClient) return;
    // log("[2/3] (onRawData2) -- step2");
    if (getDataTimeout2) clearTimeout(getDataTimeout2);
    getDataTimeout = null;

    // log("[2/3]已经发现扫频信号");
    log("[2/3]已发现，请多按几次<按钮>,中间间隔一小段时间。");//Press the RF button multiple times with a pause between them

    getDataTimeout3 = setTimeout(() => {
      getData3(device);
    }, 1000);
  };

  onRawData3 = (message) => {
    // log("[3/3] (onRawData3) -- step1");
    if (!closeClient) return;
    // log("[3/3] (onRawData3) -- step1");
    const hex = message.toString('hex');
    log("[3/3]结束");
    log("[3/3]学到代码: ${hex}");
    log("###"+hex);
    started = undefined;
    device.cancelLearn();

    closeClient();

    turnOffCallback();
  };

  device.on('rawRFData', onRawData);
  device.on('rawRFData2', onRawData2);
  device.on('rawData', onRawData3);

  device.enterRFSweep();
  log("[0/3]搜索中");
  log("[0/3]请按住遥控按钮发出RF信号...");//Hold down the button that sends the RF frequency

  if (callback) callback();

  getDataTimeout = setTimeout(() => {
    getData(device);
  }, 1000);

  if (disableTimeout) return;

  // Timeout the client after 20 seconds
  timeout = setTimeout(() => {
    
    device.cancelLearn()

    setTimeout(() => {
      log("###Scan RF (超过20秒，已经自动结束)");
      started = undefined;
      closeClient();

      turnOffCallback();
    }, 1000);
  }, 20 * 1000); // 20s
}

const getData = (device) => {
  // log("[INFO] (getData) -- step1");
  if (getDataTimeout) clearTimeout(getDataTimeout);
  if (!closeClient) return;
  // log("[INFO] (getData) -- step2");
  device.checkRFData();
  // log("[INFO] (getData) -- step3");
  getDataTimeout = setTimeout(() => {
    getData(device);
  }, 1000);
}

const getData2 = (device) => {
  if (getDataTimeout2) clearTimeout(getDataTimeout2);
  if (!closeClient) return;

  device.checkRFData2();

  getDataTimeout2 = setTimeout(() => {
    getData2(device);
  }, 1000);
}

const getData3 = (device) => {
  if (getDataTimeout3) clearTimeout(getDataTimeout3);
  if (!closeClient) return;

  device.checkData()

  getDataTimeout3 = setTimeout(() => {
    getData3(device);
  }, 1000);
}

module.exports = { start, stop ,getStatus}