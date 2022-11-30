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
})

// winston 的 rejectionHandlers / exceptionHandlers 实现有 bug，配置后在遇到
// unhandledRejection 时会导致 logger 的 stream 永久 pause，所以这里手动写日志。
process.on('unhandledRejection', (error) => {
  logger.error('unhandledRejection', error)
})
process.on('unhandleExceptions', (error) => {
  logger.error('unhandleExceptions', error)
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
