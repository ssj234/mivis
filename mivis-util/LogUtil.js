var log4js = require('log4js');

module.exports = function(project,logName,level ='debug'){
    log4js.configure(
        {
          appenders: {
            file: {
              type: 'file',
              filename: "/tmp/sirivis/log/"+project+'.log',
              maxLogSize: 10 * 1024 * 1024, // = 10Mb
              numBackups: 5, // keep five backup files
              compress: false, // compress the backups
              encoding: 'utf-8',
              mode: 0o0640,
              flags: 'w+'
            },
            dateFile: {
              type: 'dateFile',
              filename: "/tmp/sirivis/log/"+project+'.log',
              pattern: 'yyyy-MM-dd-hh',
              compress: true,
              encoding: 'utf-8',
              mode: 0o0640,
              flags: 'w+'
            },
            out: {
              type: 'stdout'
            }
          },
          categories: {
            default: { appenders: ['file', 'out'], level: level }
          }
        }
      );

    return log4js.getLogger(logName);
}