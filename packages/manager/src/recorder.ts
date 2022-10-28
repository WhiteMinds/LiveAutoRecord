import { Emitter } from 'mitt'
import { ChannelId, Message, Quality } from './common'
import { RecorderProvider } from './manager'
import { PickRequired } from './utils'

export interface RecorderCreateOpts {
  providerId: RecorderProvider['id']
  channelId: ChannelId
  // 预期上它应该是一个系统内的唯一 id，用于操作时的目标指定
  id?: string
  // 备注，可填入频道名、主播名等
  remarks?: string
  // 为 true 时 manager 将跳过自动检查
  disableAutoCheck?: boolean
  // 用于性能优化的选项，为 true 时禁用弹幕录制
  disableProvideCommentsWhenRecording?: boolean
  // 该项为用户配置，交给 recorder 作为决定使用哪个视频流的依据
  quality: Quality
  // 该项为用户配置，不同画质的视频流的优先级，如果设置了此项，将优先根据此决定使用哪个流，除非所有的指定流无效
  streamPriorities: string[]
  // 该项为用户配置，不同源（CDN）的优先级，如果设置了此项，将优先根据此决定使用哪个源，除非所有的指定源无效
  sourcePriorities: string[]
  // 可持久化的额外字段，让 provider 开发者可以实现更多的 customize
  extra?: string
}

export type SerializedRecorder = PickRequired<RecorderCreateOpts, 'id'>

export type RecorderState = 'idle' | 'recording' | 'stopping-record'

export interface RecordHandle {
  // 表示这一次录制操作的唯一 id
  id: string
  stream: string
  source: string
  url: string

  savePath: string

  stop: (this: RecordHandle) => Promise<void>
}

export interface Recorder
  extends Emitter<{
      RecordStart: RecordHandle
      RecordStop: RecordHandle
      Updated: ((string & {}) | keyof Recorder)[]
      Message: Message
    }>,
    RecorderCreateOpts {
  id: string
  // 该项由 recorder 自身控制，决定有哪些可用的视频流
  availableStreams: string[]
  // 该项由 recorder 自身控制，决定有哪些可用的源（CDN）
  availableSources: string[]
  usedStream?: string
  usedSource?: string
  state: RecorderState
  // TODO: 随机的一条近期弹幕 / 评论，这或许应该放在 manager 层做，上面再加个频率统计之类的
  // recently comment: { time, text, ... }

  getChannelURL: (this: Recorder) => string

  // TODO: 这个接口以后可能会拆成两个，因为要考虑有些网站可能会提供批量检查直播状态的接口，比如斗鱼
  checkLiveStatusAndRecord: (
    this: Recorder,
    opts: {
      getSavePath(data: { owner: string; title: string }): string
    }
  ) => Promise<RecordHandle | null>
  // 正在进行的录制的操作接口
  recordHandle?: RecordHandle

  // 提取需要序列化存储的数据到扁平的 json 数据结构
  toJSON: (this: Recorder) => SerializedRecorder
}
