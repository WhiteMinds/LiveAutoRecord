import { Recorder, RecorderCreateOpts } from '@autorecord/manager'
import { Router } from 'express'
import { recorderManager, saveRecordersConfig } from '../manager'
import { assertObjectType, assertStringType, omit } from '../utils'
import { API, ClientRecorder } from './api_types'
import { createPagedResultGetter, getNumberFromQuery } from './utils'

const router = Router()

// API 的实际实现，这里负责实现对外暴露的接口，并假设 Args 都已经由上一层解析好了
// TODO: 暂时先一起放这个文件里，后面要拆分放到合适的地方

async function getRecorders(
  args: API.getRecorders.Args
): Promise<API.getRecorders.Resp> {
  const pagedGetter = createPagedResultGetter(async (startIdx, count) => {
    return {
      items: recorderManager.recorders
        .slice(startIdx, startIdx + count)
        .map((item) => recorderToClient(item)),
      total: recorderManager.recorders.length,
    }
  })
  return pagedGetter(args.page, args.pageSize)
}

async function addRecorder(
  args: API.addRecorder.Args
): Promise<API.addRecorder.Resp> {
  const recorder = recorderManager.addRecorder(args.createOpts)
  // TODO: 目前没必要性能优化，直接全量写回。另外可以考虑监听 manager 的事件来自动触发。
  saveRecordersConfig()
  return recorderToClient(recorder)
}

// API 与外部系统的连接，负责将外部系统传递的数据解析为正确的参数后调用合适的 API 并返回结果

router
  .route('/recorders')
  .get(async (req, res) => {
    const page = getNumberFromQuery(req, 'page', { defaultValue: 1, min: 1 })
    const pageSize = getNumberFromQuery(req, 'pageSize', {
      defaultValue: 10,
      min: 1,
      max: 9999,
    })

    res.json({
      payload: await getRecorders({ page, pageSize }),
    })
  })
  .post(async (req, res) => {
    const { createOpts } = req.body ?? {}
    assertObjectType(createOpts)

    res.json({
      payload: await addRecorder({
        // TODO: 这里先不做 schema 校验，以后再加
        createOpts: createOpts as RecorderCreateOpts,
      }),
    })
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
    providerName:
      recorderManager.providers.find(({ id }) => id === recorder.providerId)
        ?.name ?? 'unknown',
    channelURL: recorder.getChannelURL(),
    ...(recorder.recordHandle && omit(recorder.recordHandle, 'stop')),
  }
}

export { router }
