import { Router } from 'express'
import { recorderManager } from '../manager'
import { pick } from '../utils'
import { API } from './api_types'

const router = Router()

function getManager(args: API.getManager.Args): API.getManager.Resp {
  return pick(recorderManager, 'savePathRule', 'autoCheckLiveStatusAndRecord')
}

function updateManager(args: API.updateManager.Args): API.updateManager.Resp {
  Object.assign(recorderManager, args)
  // TODO: 这段或许应该放在 recorderManager 内部实现
  if (args.autoCheckLiveStatusAndRecord != null) {
    if (
      args.autoCheckLiveStatusAndRecord &&
      !recorderManager.isCheckLoopRunning
    ) {
      recorderManager.startCheckLoop()
    }

    if (
      !args.autoCheckLiveStatusAndRecord &&
      recorderManager.isCheckLoopRunning
    ) {
      recorderManager.stopCheckLoop()
    }
  }
  // TODO: recorderManager emit event?
  // TODO: save config?
  return pick(recorderManager, 'savePathRule', 'autoCheckLiveStatusAndRecord')
}

router
  .route('/manager')
  .get(async (req, res) => {
    res.json({ payload: getManager({}) })
  })
  .patch(async (req, res) => {
    const args = pick(
      // TODO: 这里先不做 schema 校验，以后再加
      (req.body ?? {}) as API.updateManager.Args,
      'savePathRule',
      'autoCheckLiveStatusAndRecord'
    )

    res.json({ payload: updateManager(args) })
  })

export { router }
