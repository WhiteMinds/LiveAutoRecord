import path from 'path'
import fs from 'fs-extra'
import * as log4js from 'log4js'
import { LogFolderPath } from 'const'

fs.ensureDirSync(LogFolderPath)

log4js.configure({
  appenders: {
    console: { type: 'console', layout: { type: 'messagePassThrough' } },
    file: { type: 'file', filename: path.join(LogFolderPath, 'log.txt'), maxLogSize: 1048576, backups: 10 }
  },
  categories: { default: { appenders: ['console', 'file'], level: process.env.LOG_LEVEL || 'debug' } }
})

export default log4js.getLogger('LAR')
