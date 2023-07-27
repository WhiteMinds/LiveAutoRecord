/**
 * 这个 Service 负责提供具有状态缓存的 recorders 操作，是对 Store 和 LARService 的封装。
 *
 * TODO: Service 从设计上来说只应该依赖 Service、外部模块、更底层的层级，但这个模块里依赖了
 * store，是不是要考虑把 store 也挪到 service 层？
 */
import type { ClientRecorder } from '@autorecord/http-server'
import { Subscription, tap } from 'rxjs'
import { useStore } from '../../store'
import { singleton } from '../../utils'
import { LARServerService } from '../LARServerService'

let fetched = false

async function _getReactiveRecorders() {
  const store = useStore()

  if (!fetched) {
    // TODO: 最好先确保 es 已经连上，不然可能会丢一部分事件，不过这个优化应该在 es 做了断线重连
    // 后再做，不然还是会丢事件。
    // TODO: 虽然 API 设计了分页，但考虑到要结合实时性的复杂度，目前先全量取。
    const res = await LARServerService.getRecorders({ page: 1, pageSize: 9999 })
    // TODO: 没测试直接重设 store.recorders 会不会有问题，保险起见先用 splice 了。
    store.recorders.splice(0, store.recorders.length, ...res.items)
    fetched = true
  }

  return store.recorders
}
const getReactiveRecorders = singleton(_getReactiveRecorders)

function addOrUpdateRecorderCache(recorder: ClientRecorder): ClientRecorder {
  const store = useStore()
  const existedRecorder = store.recorders.find((r) => r.id === recorder.id)
  if (existedRecorder == null) {
    // 不能直接返回传入的 recorder，要给一个 reactive 的版本。
    const len = store.recorders.push(recorder)
    return store.recorders[len - 1]
  } else {
    Object.assign(existedRecorder, recorder)
    return existedRecorder
  }
}

function removeRecorderCache(id: ClientRecorder['id']): void {
  const store = useStore()
  const idx = store.recorders.findIndex((r) => r.id === id)
  if (idx === -1) return
  store.recorders.splice(idx, 1)
}

async function getReactiveRecorder(
  id: ClientRecorder['id'],
  opts: { noCache?: boolean } = {},
): Promise<ClientRecorder | undefined> {
  const store = useStore()

  if (opts.noCache) {
    const recorder = await LARServerService.getRecorder({ id })
    return addOrUpdateRecorderCache(recorder)
  }

  return store.recorders.find((r) => r.id === id)
}

async function addRecorder(...args: Parameters<(typeof LARServerService)['addRecorder']>): Promise<ClientRecorder> {
  const recorder = await LARServerService.addRecorder(...args)
  return addOrUpdateRecorderCache(recorder)
}

async function updateRecorder(
  ...args: Parameters<(typeof LARServerService)['updateRecorder']>
): Promise<ClientRecorder> {
  const recorder = await LARServerService.updateRecorder(...args)
  return addOrUpdateRecorderCache(recorder)
}

async function removeRecorder(id: ClientRecorder['id']): Promise<void> {
  await LARServerService.removeRecorder({ id })
  removeRecorderCache(id)
}

async function startRecord(id: ClientRecorder['id']): Promise<ClientRecorder> {
  const recorder = await LARServerService.startRecord({ id })
  return addOrUpdateRecorderCache(recorder)
}

async function stopRecord(id: ClientRecorder['id']): Promise<ClientRecorder> {
  const recorder = await LARServerService.stopRecord({ id })
  return addOrUpdateRecorderCache(recorder)
}

function startUpdateRecordersOnServerMessage() {
  const sub = LARServerService.getServerMessages()
    .pipe(
      tap((msg) => {
        switch (msg.event) {
          case 'add_recorder':
          case 'update_recorder':
            addOrUpdateRecorderCache(msg.recorder)
            break

          case 'remove_recorder':
            removeRecorderCache(msg.id)
            break
        }
      }),
    )
    .subscribe()

  return () => sub.unsubscribe()
}

function startUpdateStoreOnServerMessage() {
  const sub = new Subscription()
  sub.add(startUpdateRecordersOnServerMessage())
  return () => sub.unsubscribe()
}

export const RecorderService = {
  getReactiveRecorders,
  getReactiveRecorder,
  addRecorder,
  updateRecorder,
  removeRecorder,
  startRecord,
  stopRecord,

  startUpdateStoreOnServerMessage,
}
