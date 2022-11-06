import type { SSEMessage } from '@autorecord/http-server'
import { tap } from 'rxjs'
import { LARServerService } from '../LARServerService'
import { NotificationService } from '../NotificationService'
import { TabService } from '../TabService'

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

    // TODO: 先提示的简单点，后面加点图标之类的
    NotificationService.notify({
      title: `频道 ${msg.recorder.channelId} 开始录制`,
    })
  })

  const updateNoticeSettingOnChange = tap<SSEMessage>((msg) => {
    if (msg.event !== 'settings_change') return

    RecordService.noticeOnRecordStart = msg.settings.noticeOnRecordStart
  })

  LARServerService.getServerMessages()
    .pipe(updateNoticeSettingOnChange, tryNoticeOnRecordStartMsg)
    .subscribe()
}

export const RecordService = {
  noticeOnRecordStart: true,
  init,
}
