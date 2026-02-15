import { ErrorRequestHandler, Router } from 'express'
import { router as recorderRoutes } from './recorder'
import { router as recordRoutes } from './record'
import { router as managerRoutes } from './manager'
import { router as eventRoutes } from './event'
import { createRouter as createSettingRouter } from './setting'
import { createRouter as createLoggerRouter } from './logger'
import { ServerOpts } from '../types'
// import { respond } from './utils'

export function createRouter(serverOpts: ServerOpts) {
  const { logger } = serverOpts
  const router = Router()

  router.use(recorderRoutes)
  router.use(recordRoutes)
  router.use(managerRoutes)
  router.use(eventRoutes)
  const settingRoutes = createSettingRouter(serverOpts)
  router.use(settingRoutes)
  const loggerRoutes = createLoggerRouter(serverOpts)
  router.use(loggerRoutes)

  const handle: ErrorRequestHandler = (err: unknown, req, res, next) => {
    // 裁剪体积过大的 AxiosError
    if (err != null && typeof err === 'object' && 'isAxiosError' in err) {
      delete err['request']
      delete err['response']
    }

    logger.error('RouterError', err)
    if (err instanceof Error) {
      // respond(res, { error: err.message }).status(500)
      return
    }

    // respond(res, { error: String(err) }).status(500)
  }
  router.use(handle)

  return router
}
