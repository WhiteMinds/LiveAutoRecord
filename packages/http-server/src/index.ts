import './prepare'
import path from 'path'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import { initRecorderManager } from './manager'
import { createRouter } from './routes'
import { initDB } from './db'
import { Settings } from '@autorecord/shared'
import { paths } from './env'
import { PickPartial, readJSONFile, writeJSONFile } from './utils'
import { ServerOpts } from './types'

export * from './routes/api_types'

export async function startServer(
  opts: PickPartial<ServerOpts, 'getSettings' | 'setSettings'> = {}
) {
  const serverOpts: ServerOpts = {
    getSettings: opts.getSettings ?? defaultGetSettings,
    setSettings: opts.setSettings ?? defaultSetSettings,
  }

  console.log('initializing db')
  await initDB()

  console.log('initializing recorder manager')
  await initRecorderManager()

  console.log('HTTP server starting')
  const app = express()
  app.use(express.json({ limit: '32mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(
    cors({
      origin: 'http://localhost:5173',
    })
  )

  app.use(morgan('default'))
  const router = createRouter(serverOpts)
  app.use('/api', router)

  const port = process.env.PORT ?? 8085
  app.listen(port, () => {
    console.log(`HTTP server started, listening at http://localhost:${port}`)
  })
}

// TODO: Opts 的默认值代码似乎不应该放这里
const settingsConfigPath = path.join(paths.config, 'settings.json')
async function defaultGetSettings() {
  return readJSONFile<Settings>(settingsConfigPath, {
    notExitOnAllWindowsClosed: true,
    noticeOnRecordStart: true,
  })
}
async function defaultSetSettings(newSettings: Settings) {
  await writeJSONFile(settingsConfigPath, newSettings)
  return newSettings
}

const isDirectlyRun = require.main === module
if (isDirectlyRun) {
  void startServer()
}
