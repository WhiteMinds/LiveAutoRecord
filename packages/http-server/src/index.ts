import './prepare'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import { initDB } from './db'
import { initRecorderManager } from './manager'
import { router } from './routes'

export async function startServer() {
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
  app.use('/api', router)

  const port = process.env.PORT ?? 8085
  app.listen(port, () => {
    console.log(`HTTP server started, listening at http://localhost:${port}`)
  })
}

const isDirectlyRun = require.main === module
if (isDirectlyRun) {
  void startServer()
}
