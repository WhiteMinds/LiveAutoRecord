import { Router } from 'express'
import { recorderManager } from '../manager'
import { memoizeDebounce } from '../utils'
import { SSEMessage } from './api_types'
import { SSE } from './sse'
import { recorderToClient } from './utils'

const sse = new SSE()

function broadcastMessage(msg: SSEMessage) {
  sse.send(msg)
}

/**
 * 对 broadcastMessage 的调用做一些调度。
 * 1. 在 update_recorder 时，对每个不同的 recorderId 做同 tick 内的防抖
 *
 * TODO: 不知道会不会有内存占用过多的问题
 */
const scheduleBroadcastMessage = memoizeDebounce(broadcastMessage, 0, {
  resolver: (msg) => {
    if (msg.event === 'update_recorder') return msg.recorder.id
    return msg
  },
})

recorderManager.on('RecorderUpdated', ({ recorder }) => {
  scheduleBroadcastMessage({
    event: 'update_recorder',
    recorder: recorderToClient(recorder),
  })
})
recorderManager.on('RecorderAdded', (recorder) => {
  scheduleBroadcastMessage({
    event: 'add_recorder',
    recorder: recorderToClient(recorder),
  })
})
recorderManager.on('RecorderRemoved', (recorder) => {
  scheduleBroadcastMessage({
    event: 'remove_recorder',
    id: recorder.id,
  })
})

const router = Router()
router.get('/events', sse.init)
export { router }
