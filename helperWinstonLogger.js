const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const winston = require('winston');
const ecsWinstonFormat = require('@elastic/ecs-winston-format')

require('winston-daily-rotate-file');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  //const environment = process.env.NODE_ENV || 'development'
  const isDevelopment = environment === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

/*const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
]*/

const transports = [
  new winston.transports.Console(),
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/all-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
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


/* ## another interesting example 

const { createLogger, format, transports } = require("winston");

// https://github.com/winstonjs/winston#logging
// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const level = process.env.LOG_LEVEL || "debug";

function formatParams(info) {
  const { timestamp, level, message, ...args } = info;
  const ts = timestamp.slice(0, 19).replace("T", " ");

  return `${ts} ${level}: ${message} ${Object.keys(args).length
    ? JSON.stringify(args, "", "")
    : ""}`;
}

// https://github.com/winstonjs/winston/issues/1135
const developmentFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf(formatParams)
);

const productionFormat = format.combine(
  format.timestamp(),
  format.align(),
  format.printf(formatParams)
);

let logger;

if (process.env.NODE_ENV !== "production") {
  logger = createLogger({
    level: level,
    format: developmentFormat,
    transports: [new transports.Console()]
  });

} else {
  logger = createLogger({
    level: level,
    format: productionFormat,
    transports: [
      new transports.File({ filename: "error.log", level: "error" }),
      new transports.File({ filename: "combined.log" })
    ]
  });
}

module.exports = logger;
*/
