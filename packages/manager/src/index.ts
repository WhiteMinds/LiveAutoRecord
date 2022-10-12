import path from 'path'
import mitt, { Emitter } from 'mitt'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import R from 'ramda'
import format from 'string-template'
import { v4 as uuid } from 'uuid'

ffmpeg.setFfmpegPath(ffmpegPath)

export type ChannelId = string

export const Qualities = ['lowest', 'low', 'medium', 'high', 'highest'] as const
export type Quality = typeof Qualities[number]

export interface RecorderCreateOpts {
  providerId: RecorderProvider['id']
  channelId: ChannelId
  // 预期上它应该是一个系统内的唯一 id，用于操作时的目标指定
  id?: string
  // 备注，可填入频道名、主播名等
  remarks?: string
  // 为 true 时跳过自动检查
  disableAutoCheck?: boolean
  // 该项为用户配置，交给 recorder 作为决定使用哪个视频流的依据
  quality: Quality
  // 该项为用户配置，不同画质的视频流的优先级，如果设置了此项，将优先根据此决定使用哪个流，除非所有的指定流无效
  streamPriorities: string[]
  // 该项为用户配置，不同源（CDN）的优先级，如果设置了此项，将优先根据此决定使用哪个源，除非所有的指定源无效
  sourcePriorities: string[]
  // 可持久化的额外字段，让 provider 开发者可以实现更多的 customize
  extra?: string
}

type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>

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
      Updated: (keyof Recorder)[]
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
  // 随机的一条近期弹幕 / 评论
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

export interface RecorderProvider {
  // Provider 的唯一 id，最好只由英文 + 数字组成
  // TODO: 可以加个检查 id 合法性的逻辑
  id: string
  name: string
  siteURL: string

  // 用基础的域名、路径等方式快速决定一个 URL 是否能匹配此 provider
  matchURL: (this: RecorderProvider, channelURL: string) => boolean
  // 从一个与当前 provider 匹配的 URL 中解析与获取对应频道的一些信息
  resolveChannelInfoFromURL: (
    this: RecorderProvider,
    channelURL: string
  ) => Promise<{
    id: ChannelId
    title: string
    owner: string
  } | null>
  createRecorder: (
    this: RecorderProvider,
    opts: Omit<RecorderCreateOpts, 'providerId'>
  ) => Recorder

  fromJSON: <T extends SerializedRecorder>(
    this: RecorderProvider,
    json: T
  ) => Recorder
}

export interface RecorderManager
  extends Emitter<{
    error: unknown
    RecordStart: { recorder: Recorder; recordHandle: RecordHandle }
    RecordStop: { recorder: Recorder; recordHandle: RecordHandle }
    RecorderUpdated: { recorder: Recorder; keys: (keyof Recorder)[] }
    RecorderAdded: Recorder
    RecorderRemoved: Recorder
  }> {
  providers: RecorderProvider[]
  loadRecorderProvider: (
    this: RecorderManager,
    provider: RecorderProvider
  ) => void
  unloadRecorderProvider: (
    this: RecorderManager,
    providerId: RecorderProvider['id']
  ) => void
  // TODO: 这个或许可以去掉或者改改，感觉不是很有必要
  getChannelURLMatchedRecorderProviders: (
    this: RecorderManager,
    channelURL: string
  ) => RecorderProvider[]

  recorders: Recorder[]
  addRecorder: (this: RecorderManager, opts: RecorderCreateOpts) => Recorder
  removeRecorder: (this: RecorderManager, recorder: Recorder) => void

  autoCheckLiveStatusAndRecord: boolean
  isCheckLoopRunning: boolean
  startCheckLoop: (this: RecorderManager) => void
  stopCheckLoop: (this: RecorderManager) => void

  savePathRule: string
}

export type RecorderManagerCreateOpts = Partial<
  Pick<RecorderManager, 'savePathRule' | 'autoCheckLiveStatusAndRecord'>
>

export function createRecorderManager(
  opts: RecorderManagerCreateOpts = {}
): RecorderManager {
  const providerMap: Record<RecorderProvider['id'], RecorderProvider> = {}
  const recorders: Recorder[] = []

  let checkLoopTimer: NodeJS.Timeout | undefined
  const checkLoopInterval: number = 1e3

  const multiThreadCheck = async () => {
    const maxThreadCount = 3
    // 这里暂时不打算用 state == recording 来过滤，provider 必须内部自己处理录制过程中的 check，
    // 这样可以防止一些意外调用 checkLiveStatusAndRecord 时出现重复录制。
    const needCheckRecorders = recorders.filter((r) => !r.disableAutoCheck)

    const checkOnce = async () => {
      const recorder = needCheckRecorders.pop()
      if (recorder == null) return

      await recorder.checkLiveStatusAndRecord({
        getSavePath(data) {
          return genSavePathFromRule(manager, recorder, data)
        },
      })
    }

    const threads = R.range(0, maxThreadCount).map(async () => {
      while (needCheckRecorders.length > 0) {
        await checkOnce()
      }
    })

    await Promise.all(threads)
  }

  const manager: RecorderManager = {
    ...mitt(),

    providers: [],
    loadRecorderProvider(provider) {
      providerMap[provider.id] = provider
      this.providers = Object.values(providerMap)
    },
    unloadRecorderProvider(id) {
      delete providerMap[id]
      this.providers = Object.values(providerMap)
    },
    getChannelURLMatchedRecorderProviders(channelURL) {
      return this.providers.filter((p) => p.matchURL(channelURL))
    },

    recorders,
    addRecorder(opts) {
      const provider = providerMap[opts.providerId]
      if (provider == null) throw new Error('')

      const recorder = provider.createRecorder(R.omit(['providerId'], opts))
      this.recorders.push(recorder)

      recorder.on('RecordStart', (recordHandle) =>
        this.emit('RecordStart', { recorder, recordHandle })
      )
      recorder.on('RecordStop', (recordHandle) =>
        this.emit('RecordStop', { recorder, recordHandle })
      )
      recorder.on('Updated', (keys) =>
        this.emit('RecorderUpdated', { recorder, keys })
      )

      this.emit('RecorderAdded', recorder)

      return recorder
    },
    removeRecorder(recorder) {
      const idx = this.recorders.findIndex((item) => item === recorder)
      if (idx === -1) return
      recorder.recordHandle?.stop()
      this.recorders.splice(idx, 1)
      this.emit('RecorderRemoved', recorder)
    },

    autoCheckLiveStatusAndRecord: opts.autoCheckLiveStatusAndRecord ?? true,
    isCheckLoopRunning: false,
    startCheckLoop() {
      if (this.isCheckLoopRunning) return
      this.isCheckLoopRunning = true
      // TODO: emit updated event

      const checkLoop = async () => {
        try {
          await multiThreadCheck()
        } catch (err) {
          this.emit('error', err)
        } finally {
          if (!this.isCheckLoopRunning) return
          checkLoopTimer = setTimeout(checkLoop, checkLoopInterval)
        }
      }

      void checkLoop()
    },
    stopCheckLoop() {
      if (!this.isCheckLoopRunning) return
      this.isCheckLoopRunning = false
      // TODO: emit updated event
      clearTimeout(checkLoopTimer)
    },

    savePathRule:
      opts.savePathRule ??
      path.join(
        __dirname,
        '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}'
      ),
  }

  return manager
}

function genSavePathFromRule(
  manager: RecorderManager,
  recorder: Recorder,
  extData: {
    owner: string
    title: string
  }
): string {
  // TODO: 这里随便写的，后面再优化
  const provider = manager.providers.find(
    (p) => p.id === recorder.toJSON().providerId
  )

  const now = new Date()
  const params = {
    platform: provider?.name ?? 'unknown',
    channelId: recorder.channelId,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: now.getDate(),
    hour: now.getHours(),
    min: now.getMinutes(),
    sec: now.getSeconds(),
    ...extData,
  }

  return format(manager.savePathRule, params)
}

/**
 * 提供一些 utils
 */

export function defaultFromJSON(
  provider: RecorderProvider,
  json: SerializedRecorder
): Recorder {
  return provider.createRecorder(R.omit(['providerId'], json))
}

export function defaultToJSON(
  provider: RecorderProvider,
  recorder: Recorder
): SerializedRecorder {
  return {
    providerId: provider.id,
    ...R.pick(
      [
        'id',
        'channelId',
        'remarks',
        'disableAutoCheck',
        'quality',
        'streamPriorities',
        'sourcePriorities',
        'extra',
      ],
      recorder
    ),
  }
}

// 目前是假设使用环境的规模都比较小，不太容易遇到性能问题，所以用 string uuid 作为 id 来简化开发的复杂度。
// 后面如果需要再高一些的规模，可以优化成分布式 id 生成器，或者其他的异步生成 id 的方案。
export function genRecorderUUID(): Recorder['id'] {
  return uuid()
}
export function genRecordUUID(): RecordHandle['id'] {
  return uuid()
}

export const createFFMPEGBuilder = ffmpeg

export function getDataFolderPath(provider: RecorderProvider): string {
  // TODO: 改成 AppData 之类的目录
  return './' + provider.id
}
