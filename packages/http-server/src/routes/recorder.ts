import { Recorder, RecorderCreateOpts, RecordHandle } from '@autorecord/manager'
import { Router } from 'express'
import { recorderManager, saveRecordersConfig } from '../manager'
import { assertObjectType, assertStringType, omit } from '../utils'
import { createPagedResultGetter, getNumberFromQuery } from './utils'

const router = Router()

router
  .route('/recorders')
  .get(async (req, res) => {
    const page = getNumberFromQuery(req, 'page', { defaultValue: 1, min: 1 })
    const pageSize = getNumberFromQuery(req, 'pageSize', {
      defaultValue: 10,
      min: 1,
      max: 9999,
    })

    const pagedGetter = createPagedResultGetter(async (startIdx, count) => {
      return {
        items: recorderManager.recorders
          .slice(startIdx, startIdx + count)
          .map((item) => recorderToClient(item)),
        total: recorderManager.recorders.length,
      }
    })

    res.json({
      payload: await pagedGetter(page, pageSize),
    })
  })
  .post(async (req, res) => {
    const { providerId, createOpts } = req.body ?? {}
    assertStringType(providerId)
    assertObjectType(createOpts)
    const recorder = recorderManager.addRecorder(
      providerId,
      // TODO: 这里先不做 schema 校验，以后再加
      createOpts as RecorderCreateOpts
    )
    res.json({
      payload: recorderToClient(recorder),
    })
    // TODO: 目前没必要性能优化，直接全量写回。另外可以考虑监听 manager 的事件来自动触发。
    saveRecordersConfig()
  })

router
  .route('/recorders/:id')
  .get(async (req, res) => {
    const { id } = req.params
    const recorder = recorderManager.recorders.find((item) => item.id === id)
    res.json({
      payload: recorder && recorderToClient(recorder),
    })
  })
  .delete((req, res) => {
    const { id } = req.params
    const recorder = recorderManager.recorders.find((item) => item.id === id)
    if (recorder == null) {
      res.json({})
      return
    }
    recorderManager.removeRecorder(recorder)
    res.json({})
    saveRecordersConfig()
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
