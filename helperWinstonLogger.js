//Logger helper module

const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const winston = require('winston');
const ecsWinstonFormat = require('@elastic/ecs-winston-format')

require('winston-daily-rotate-file');

const levels = {
  error: 0,
  warning: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const isDevelopment = environment === 'development'
  return isDevelopment ? 'debug' : 'info'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

/*const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)
*/

const transports = [
  new winston.transports.Console(),
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/all-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: level(),
  })
]

const winstonLogger = winston.createLogger({
  level: level(),
  levels,
  format: ecsWinstonFormat(),
  transports: transports,
})

winstonLogger.stream = {
  write: function(message, encoding){
    winstonLogger.info(message);
  }
};

module.exports = winstonLogger
