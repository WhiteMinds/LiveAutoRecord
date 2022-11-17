import path from 'path'
import { createLogger, format, transports } from 'winston'
import { paths } from './env'

export const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.label({ label: 'default' }),
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: path.join(paths.log, 'error.log'),
      level: 'error',
    }),
    new transports.File({ filename: path.join(paths.log, 'combined.log') }),
  ],
  exitOnError: false,
  rejectionHandlers: [
    new transports.File({ filename: path.join(paths.log, 'rejections.log') }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(paths.log, 'exceptions.log') }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.align(),
        format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} [${label}] ${level}: ${message}`
        })
      ),
    })
  )
}
