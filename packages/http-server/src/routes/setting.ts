import { Router } from 'express'
import { Settings } from '@autorecord/shared'
import { API } from './api_types'
import { ServerOpts } from '../types'
import { scheduleBroadcastMessage } from './event'

export function createRouter(serverOpts: ServerOpts) {
  const router = Router()

  async function getSettings(args: API.getSettings.Args): Promise<API.getSettings.Resp> {
    return serverOpts.getSettings()
  }

  async function setSettings(args: API.setSettings.Args): Promise<API.setSettings.Resp> {
    const newSettings: Settings = args
    return serverOpts.setSettings(newSettings)
  }

  router
    .route('/settings')
    .get(async (req, res) => {
      res.json({ payload: await getSettings({}) })
    })
    .put(async (req, res) => {
      // TODO: 这里先不做 schema 校验，以后再加
      const args = req.body as API.setSettings.Args
      const newSettings = await setSettings(args)

      res.json({ payload: newSettings })

      scheduleBroadcastMessage({
        event: 'settings_change',
        settings: newSettings,
      })
    })

  return router
}
