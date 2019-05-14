export const ChannelStatus = {
  Checking: 1,
  PrepareRecord: 2,
  Removing: 3,
  Recording: 4,
  NotCheck: 5
}

Object.assign(ChannelStatus, {
  [ChannelStatus.Removing]: '正在删除',
  [ChannelStatus.Checking]: '正在检查',
  [ChannelStatus.PrepareRecord]: '准备录制',
  [ChannelStatus.Recording]: '正在录制',
  [ChannelStatus.NotCheck]: '暂不检查'
})

export const ChannelStatusPriority = [
  // 权值从高到低
  ChannelStatus.Removing,
  ChannelStatus.Checking,
  ChannelStatus.PrepareRecord,
  ChannelStatus.Recording,
  ChannelStatus.NotCheck
]
