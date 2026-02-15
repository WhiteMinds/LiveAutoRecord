import path from 'path'
import { createLogger as createWinstonLogger, format, transports } from 'winston'
import { paths } from '@autorecord/core'

export function createLogger() {
  const logger = createWinstonLogger({
    levels: {
      error: 3,
      warn: 4,
      info: 6,
      debug: 7,
    },
    level: 'debug',
    format: format.combine(format.label({ label: 'default' }), format.timestamp(), format.json()),
    transports: [
      new transports.File({
        filename: path.join(paths.log, 'server-error.log'),
        level: 'error',
        maxsize: 1024 * 1024 * 4,
        maxFiles: 4,
      }),
      new transports.File({
        filename: path.join(paths.log, 'server-combined.log'),
        maxsize: 1024 * 1024 * 32,
        maxFiles: 4,
      }),
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
          }),
        ),
      }),
    )
  }

  return logger
}
