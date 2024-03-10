import { genSavePathFromRule } from '@autorecord/manager'
import { Router } from 'express'
import { addRecorderWithAutoIncrementId, recorderManager } from '../manager'
import { pick } from '../utils'
import { API } from './api_types'
import { asyncRouteHandler, createPagedResultGetter, getNumberFromQuery, recorderToClient } from './utils'

const router = Router()

// API 的实际实现，这里负责实现对外暴露的接口，并假设 Args 都已经由上一层解析好了
// TODO: 暂时先一起放这个文件里，后面要拆分放到合适的地方

async function getRecorders(args: API.getRecorders.Args): Promise<API.getRecorders.Resp> {
  const pagedGetter = createPagedResultGetter(async (startIdx, count) => {
    return {
      items: recorderManager.recorders.slice(startIdx, startIdx + count).map((item) => recorderToClient(item)),
      total: recorderManager.recorders.length,
    }
  })
  return pagedGetter(args.page, args.pageSize)
}

function getRecorder(args: API.getRecorder.Args): API.getRecorder.Resp {
  const recorder = recorderManager.recorders.find((item) => item.id === args.id)
  // TODO: 之后再处理
  if (recorder == null) throw new Error('404')

  return recorderToClient(recorder)
}

function addRecorder(args: API.addRecorder.Args): API.addRecorder.Resp {
  const recorder = addRecorderWithAutoIncrementId(args)
  recorder.extra.createTimestamp = Date.now()
  // TODO: 目前没必要性能优化，直接全量写回。另外可以考虑监听 manager 的事件来自动触发。
  return recorderToClient(recorder)
}

function updateRecorder(args: API.updateRecorder.Args): API.updateRecorder.Resp {
  const { id, ...data } = args
  const recorder = recorderManager.recorders.find((item) => item.id === id)
  // TODO: 之后再处理
  if (recorder == null) throw new Error('404')

  Object.assign(recorder, data)
  return recorderToClient(recorder)
}

function removeRecorder(args: API.removeRecorder.Args): API.removeRecorder.Resp {
  const recorder = recorderManager.recorders.find((item) => item.id === args.id)
  if (recorder == null) return null

  recorderManager.removeRecorder(recorder)
  return null
}

async function startRecord(args: API.startRecord.Args): Promise<API.startRecord.Resp> {
  const recorder = recorderManager.recorders.find((item) => item.id === args.id)
  if (recorder == null) throw new Error('404')

  if (recorder.recordHandle == null) {
    await recorder.checkLiveStatusAndRecord({
      getSavePath(data) {
        return genSavePathFromRule(recorderManager, recorder, data)
      },
    })
  }

  return recorderToClient(recorder)
}

async function stopRecord(args: API.stopRecord.Args): Promise<API.stopRecord.Resp> {
  const recorder = recorderManager.recorders.find((item) => item.id === args.id)
  if (recorder == null) throw new Error('404')

  if (recorder.recordHandle != null) {
    await recorder.recordHandle.stop()
    // TODO: 或许还应该自动将 recorder.disableAutoCheck 设置为 true
  }
  return recorderToClient(recorder)
}

// API 与外部系统的连接，负责将外部系统传递的数据解析为正确的参数后调用合适的 API 并返回结果

router
  .route('/recorders')
  .get(
    asyncRouteHandler(async (req, res) => {
      const page = getNumberFromQuery(req, 'page', { defaultValue: 1, min: 1 })
      const pageSize = getNumberFromQuery(req, 'pageSize', {
        defaultValue: 10,
        min: 1,
        max: 9999,
      })

      res.json({ payload: await getRecorders({ page, pageSize }) })
    }),
  )
  .post((req, res) => {
    // TODO: 这里的类型限制还是有些问题，Nullable 的 key（如 extra）如果没写在这也不会报错，之后想想怎么改
    const args = pick(
      // TODO: 这里先不做 schema 校验，以后再加
      (req.body ?? {}) as Omit<API.addRecorder.Args, 'id'>,
      'providerId',
      'channelId',
      'remarks',
      'disableAutoCheck',
      'quality',
      'streamPriorities',
      'sourcePriorities',
      'extra',
    )

    res.json({ payload: addRecorder(args) })
  })

router
  .route('/recorders/:id')
  .get((req, res) => {
    const { id } = req.params
    res.json({ payload: getRecorder({ id }) })
  })
  .patch((req, res) => {
    const { id } = req.params
    const patch = pick(
      // TODO: 这里先不做 schema 校验，以后再加
      req.body as Omit<API.updateRecorder.Args, 'id'>,
      'remarks',
      'disableAutoCheck',
      'quality',
      'streamPriorities',
      'sourcePriorities',
    )

    res.json({ payload: updateRecorder({ id, ...patch }) })
  })
  .delete((req, res) => {
    const { id } = req.params
    res.json({ payload: removeRecorder({ id }) })
  })

router.route('/recorders/:id/start_record').post(
  asyncRouteHandler(async (req, res) => {
    const { id } = req.params
    res.json({ payload: await startRecord({ id }) })
  }),
)
router.route('/recorders/:id/stop_record').post(
  asyncRouteHandler(async (req, res) => {
    const { id } = req.params
    res.json({ payload: await stopRecord({ id }) })
  }),
)

export { router }
