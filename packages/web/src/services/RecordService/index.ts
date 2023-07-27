import type { SSEMessage } from '@autorecord/http-server'
import { DebouncedFunc, throttle } from 'lodash-es'
import { tap } from 'rxjs'
import { LARServerService } from '../LARServerService'
import { NotificationService } from '../NotificationService'
import { TabService } from '../TabService'
import fastMemo from 'fast-memoize'

const getThrottledChannelNotifyFn = fastMemo(function createThrottledChannelNotifyFn(
  // 只是提供给 memoize 作为 cache 的 key，实际逻辑中不会使用。
  channelId: string,
): DebouncedFunc<typeof NotificationService.notify> {
  return throttle(NotificationService.notify.bind(NotificationService), 30e3)
})

export async function init() {
  const settings = await LARServerService.getSettings({})
  RecordService.noticeOnRecordStart = settings.noticeOnRecordStart

  const tryNoticeOnRecordStartMsg = tap<SSEMessage>((msg) => {
    // TODO: 后面看下优化后的通知效果，如果客户端下表现不太好，可以根据 isClientMode
    // 在客户端模式下由 electron main 发送通知。
    if (!RecordService.noticeOnRecordStart) return
    if (msg.event !== 'record_start') return
    // 只有一个 tab 能发出通知，不然会重复发
    if (TabService.getSelfRole() !== 'leader') return

    // 对每个频道的通知单独节流，防止开播、下播时的流不正常造成反复的录制通知。
    const notify = getThrottledChannelNotifyFn(msg.recorder.channelId)
    notify({
      title: `频道 ${msg.recorder.channelId} 开始录制`,
      body: msg.recorder.remarks,
    })
  })

  const updateNoticeSettingOnChange = tap<SSEMessage>((msg) => {
    if (msg.event !== 'settings_change') return

    RecordService.noticeOnRecordStart = msg.settings.noticeOnRecordStart
  })

  LARServerService.getServerMessages().pipe(updateNoticeSettingOnChange, tryNoticeOnRecordStartMsg).subscribe()
}

export const RecordService = {
  noticeOnRecordStart: true,
  init,
}
