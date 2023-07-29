import { Router } from 'express'
import { API } from './api_types'
import { ServerOpts } from '../types'

export function createRouter(serverOpts: ServerOpts) {
  const router = Router()

  ;['error', 'warn', 'info', 'debug'].forEach((method) => {
    router.route(`/logger/${method}`).post(async (req, res) => {
      // TODO: 这里先不做 schema 校验，以后再加
      const args = req.body as API.logMethod.Args
      serverOpts.logger[method](`[frontend]: ${args.text}`)

      res.json({ payload: null })
    })
  })

  return router
}
