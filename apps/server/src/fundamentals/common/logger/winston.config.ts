import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import * as winston from 'winston'

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
)

const consoleFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('LCW-Docs', {
        colors: true,
        prettyPrint: true,
    }),
)

export const winstonConfig: winston.LoggerOptions = {
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
        }),
    ],
}
