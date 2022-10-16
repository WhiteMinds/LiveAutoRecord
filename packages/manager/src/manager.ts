import path from 'path'
import mitt, { Emitter } from 'mitt'
import R from 'ramda'
import format from 'string-template'
import { ChannelId } from './common'
import {
  RecorderCreateOpts,
  Recorder,
  SerializedRecorder,
  RecordHandle,
} from './recorder'

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
