import { Recorder, RecorderCreateOpts, RecordHandle } from '@autorecord/manager'
import { Router } from 'express'
import { createRecorder } from '../controller'
import { recorderManager } from '../manager'
import { assertObjectType, assertStringType, omit } from '../utils'

const router = Router()

router
  .route('/recorders')
  .get(async (req, res) => {
    res.json({
      payload: recorderManager.recorders.map((item) => recorderToClient(item)),
    })
  })
  .post(async (req, res) => {
    const { providerId, createOpts } = req.body ?? {}
    assertStringType(providerId)
    assertObjectType(createOpts)
    const recorder = recorderManager.addRecorder(
      providerId,
      // TODO: 这里先不做完整验证，以后再加
      createOpts as RecorderCreateOpts
    )
    // TODO: 这里最好做一些措施防止写入失败时（比如数据库所在的盘写满了）回滚 addRecorder
    await createRecorder(recorder.toJSON())
    res.json({
      payload: recorderToClient(recorder),
    })
  })

type ClientRecorder = Omit<
  Recorder,
  // TODO: 可以改成排除所有方法 & EmitterProps
  | 'all'
  | 'getChannelURL'
  | 'checkLiveStatusAndRecord'
  | 'recordHandle'
  | 'toJSON'
> & {
  channelURL: string
  recordHandle?: Omit<RecordHandle, 'stop'>
}

function recorderToClient(recorder: Recorder): ClientRecorder {
  return {
    // TODO: 用 pick 更加稳健一些，这里省事先 omit 了
    ...omit(
      recorder,
      'all',
      'getChannelURL',
      'checkLiveStatusAndRecord',
      'recordHandle',
      'toJSON'
    ),
    channelURL: recorder.getChannelURL(),
    ...(recorder.recordHandle && omit(recorder.recordHandle, 'stop')),
  }
}

export { router }
