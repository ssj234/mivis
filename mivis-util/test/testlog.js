var Log = require("../LogUtil");

var logger = Log("sirivis","DeviceManager",'error');

logger.debug('This little thing went to market');
logger.info('This little thing stayed at home');
logger.error('This little thing had roast beef');
logger.fatal('This little thing had none');
logger.trace('and this little thing went wee, wee, wee, all the way home.');