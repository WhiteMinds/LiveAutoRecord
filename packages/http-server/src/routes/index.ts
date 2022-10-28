import { ErrorRequestHandler, Router } from 'express'
import { router as recorderRoutes } from './recorder'
import { router as recordRoutes } from './record'
import { router as managerRoutes } from './manager'
import { router as eventRoutes } from './event'
// import { respond } from './utils'

const router = Router()

router.use(recorderRoutes)
router.use(recordRoutes)
router.use(managerRoutes)
router.use(eventRoutes)

const handle: ErrorRequestHandler = (err: unknown, req, res, next) => {
  console.error(err)
  if (err instanceof Error) {
    // respond(res, { error: err.message }).status(500)
    return
  }

  // respond(res, { error: String(err) }).status(500)
}
router.use(handle)

export { router }
