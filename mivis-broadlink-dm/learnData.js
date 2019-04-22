
let closeClient = null;
let timeout = null;
let getDataTimeout = null;
var status = "init";
var starting = false;
function log(param){
    console.log("[learnIR]>>>>",param);
    status = param;
}
const stop = () => {
  // Reset existing learn requests
  if (!closeClient) return;

  closeClient();
  closeClient = null;
  log(`Learn Code (stopped)`);
}

const getStatus = () =>{
    return status;
}

const start = (device, callback, turnOffCallback, disableTimeout) => {
//   stop()
  // Get the Broadlink device
  if(starting){
      return;
  }
  if(starting === undefined){ // undefined表示完成
    starting = false;
    return;
  }
  starting = true;
  var host = device.mac;
  if (!device) {
    callback("Error",false);
    starting = false;
    log(`###Learn Code (Cannot device at ${host})`);
    return "ERROR";
  }
  if (!device.enterLearning) {
    callback("Error",false);
    starting = false;
    log(`###Learn Code (IR learning not supported for device at ${host})`);
    return "ERROR"
  }
  let onRawData;

  closeClient = (err) => {
    if (timeout) clearTimeout(timeout);
    timeout = null;

    if (getDataTimeout) clearTimeout(getDataTimeout);
    getDataTimeout = null;

    device.removeListener('rawData', onRawData);
    device.cancelLearn();
  };

  onRawData = (message) => {
    if (!closeClient) return; // 已经stop()

    const hex = message.toString('hex');
    log(`Learn Code (learned hex code: ${hex})`);
    log(`Learn Code (complete)`);
    log("###"+hex);
    starting = undefined;
    closeClient();// 关闭

    turnOffCallback();// char.on false
  };

  device.on('rawData', onRawData);

  device.enterLearning()
  log("进入学习状态中，灯亮后请按键"); //`Learn Code (ready)`

  if (callback) callback(); // 打开之后就返回了

  getDataTimeout = setTimeout(() => {
    getData(device);// 1s后checkData()
  }, 1000)

  if (disableTimeout) return;

  // Timeout the client after 10 seconds
  timeout = setTimeout(() => {
    log('###学习失败，超过10秒，已自动结束');
    if (device.cancelRFSweep) device.cancelRFSweep();
    starting = undefined;
    closeClient();

    turnOffCallback();
  }, 10000); // 10s
}

const getData = (device) => {
  if (getDataTimeout) clearTimeout(getDataTimeout);
  if (!closeClient) return;

  device.checkData()

  getDataTimeout = setTimeout(() => {
    getData(device);
  }, 1000);
}

module.exports = { start, stop ,getStatus}
