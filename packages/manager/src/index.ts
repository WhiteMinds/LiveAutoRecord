import mitt, { Emitter } from 'mitt'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import R from 'ramda'

ffmpeg.setFfmpegPath(ffmpegPath)

export type ChannelId = string

export type SerializedRecorder = Pick<RecorderProvider, 'id'> &
  RecorderCreateOpts

export const Qualities = ['lowest', 'low', 'medium', 'high', 'highest'] as const
export type Quality = typeof Qualities[number]

export interface RecorderCreateOpts {
  channelId: ChannelId
  remarks?: string
  autoCheckLiveStatusAndRecord?: boolean
  // 该项为用户配置，交给 recorder 作为决定使用哪个视频流的依据
  quality: Quality
  // 该项为用户配置，不同画质的视频流的优先级，如果设置了此项，将优先根据此决定使用哪个流，除非所有的指定流无效
  streamPriorities: string[]
  // 该项为用户配置，不同源（CDN）的优先级，如果设置了此项，将优先根据此决定使用哪个源，除非所有的指定源无效
  sourcePriorities: string[]
  extra?: string
}

export type RecorderState = 'idle' | 'recording' | 'stopping-record'

export interface RecordHandle {
  stream: string
  source: string
  url: string

  savePath: string

  stop(this: RecordHandle): Promise<void>
}

export interface Recorder extends Emitter<{}>, RecorderCreateOpts {
  // 该项由 recorder 自身控制，决定有哪些可用的视频流
  availableStreams: string[]
  // 该项由 recorder 自身控制，决定有哪些可用的源（CDN）
  availableSources: string[]
  usedStream?: string
  usedSource?: string
  state: RecorderState
  // 随机的一条近期弹幕 / 评论
  // recently comment: { time, text, ... }

  getChannelURL(this: Recorder): string

  // TODO: 这个接口以后可能会拆成两个，因为要考虑有些网站可能会提供批量检查直播状态的接口，比如斗鱼
  checkLiveStatusAndRecord(
    this: Recorder,
    opts: {
      saveFolder: string
      saveName: string
    }
  ): Promise<RecordHandle | null>
  // 正在进行的录制的操作接口
  recordHandle?: RecordHandle

  // 提取需要序列化存储的数据到扁平的 json 数据结构
  toJSON(this: Recorder): SerializedRecorder
}

export interface RecorderProvider {
  // Provider 的唯一 id，最好只由英文 + 数字组成
  // TODO: 可以加个检查 id 合法性的逻辑
  id: string
  name: string
  siteURL: string

  // 用基础的域名、路径等方式快速决定一个 URL 是否能匹配此 provider
  matchURL(this: RecorderProvider, channelURL: string): boolean
  // 从一个与当前 provider 匹配的 URL 中解析与获取对应频道的一些信息
  resolveChannelInfoFromURL(
    this: RecorderProvider,
    channelURL: string
  ): Promise<{
    id: ChannelId
    title: string
    owner: string
  } | null>
  createRecorder(this: RecorderProvider, opts: RecorderCreateOpts): Recorder

  fromJSON<T extends SerializedRecorder>(
    this: RecorderProvider,
    json: T
  ): Recorder
}

export interface RecorderManager
  extends Emitter<{
    error: unknown
  }> {
  providers: RecorderProvider[]
  loadRecorderProvider(this: RecorderManager, provider: RecorderProvider): void
  unloadRecorderProvider(
    this: RecorderManager,
    providerId: RecorderProvider['id']
  ): void
  // TODO: 这个或许可以去掉或者改改，感觉不是很有必要
  getChannelURLMatchedRecorderProviders(
    this: RecorderManager,
    channelURL: string
  ): RecorderProvider[]

  recorders: Recorder[]
  addRecorder(
    this: RecorderManager,
    providerId: RecorderProvider['id'],
    opts: RecorderCreateOpts
  ): Recorder

  isCheckLoopRunning: boolean
  startCheckLoop(this: RecorderManager): void
  stopCheckLoop(this: RecorderManager): void
}

export function createRecorderManager(): RecorderManager {
  const providerMap: Record<RecorderProvider['id'], RecorderProvider> = {}
  const recorders: Recorder[] = []

  let checkLoopTimer: NodeJS.Timeout | undefined
  const checkLoopInterval: number = 1e3

  const multiThreadCheck = async () => {
    const maxThreadCount = 3
    const needCheckRecorders = recorders.filter(
      (r) => r.autoCheckLiveStatusAndRecord ?? true
    )

    const checkOnce = async () => {
      const recorder = needCheckRecorders.pop()
      if (recorder == null) return

      const handle = await recorder.checkLiveStatusAndRecord({
        // TODO: 需要 name 生成规则
        saveFolder: __dirname,
        saveName: recorder.channelId,
      })
      if (handle == null) return

      // TODO: 似乎不需要处理 handle？
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
    addRecorder(providerId, opts) {
      const provider = providerMap[providerId]
      if (provider == null) throw new Error('')

      const recorder = provider.createRecorder(opts)
      this.recorders.push(recorder)
      // TODO: emit updated event

      return recorder
    },

    isCheckLoopRunning: false,
    startCheckLoop() {
      if (this.isCheckLoopRunning) return
      this.isCheckLoopRunning = true

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
  }

  return manager
}

/**
 * 提供一些 utils
 */

export function defaultFromJSON(
  provider: RecorderProvider,
  json: SerializedRecorder
): Recorder {
  return provider.createRecorder(R.omit(['id'], json))
}

export function defaultToJSON(
  provider: RecorderProvider,
  recorder: Recorder
): SerializedRecorder {
  return {
    id: provider.id,
    ...R.pick(
      [
        'channelId',
        'remarks',
        'autoCheckLiveStatusAndRecord',
        'quality',
        'streamPriorities',
        'sourcePriorities',
        'extra',
      ],
      recorder
    ),
  }
}

export const createFFMPEGBuilder = ffmpeg

export function getDataFolderPath(provider: RecorderProvider): string {
  // TODO: 改成 AppData 之类的目录
  return './' + provider.id
}
