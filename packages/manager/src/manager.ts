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
import { AnyObject, UnknownObject } from './utils'

export interface RecorderProvider<E extends AnyObject> {
  // Provider 的唯一 id，最好只由英文 + 数字组成
  // TODO: 可以加个检查 id 合法性的逻辑
  id: string
  name: string
  siteURL: string

  // 用基础的域名、路径等方式快速决定一个 URL 是否能匹配此 provider
  matchURL: (this: RecorderProvider<E>, channelURL: string) => boolean
  // 从一个与当前 provider 匹配的 URL 中解析与获取对应频道的一些信息
  resolveChannelInfoFromURL: (
    this: RecorderProvider<E>,
    channelURL: string
  ) => Promise<{
    id: ChannelId
    title: string
    owner: string
  } | null>
  createRecorder: (
    this: RecorderProvider<E>,
    opts: Omit<RecorderCreateOpts<E>, 'providerId'>
  ) => Recorder<E>

  fromJSON: <T extends SerializedRecorder<E>>(
    this: RecorderProvider<E>,
    json: T
  ) => Recorder<E>
}

export interface RecorderManager<
  ME extends UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE
> extends Emitter<{
    error: unknown
    RecordStart: { recorder: Recorder<E>; recordHandle: RecordHandle }
    RecordStop: { recorder: Recorder<E>; recordHandle: RecordHandle }
    RecorderUpdated: {
      recorder: Recorder<E>
      keys: ((string & {}) | keyof Recorder<E>)[]
    }
    RecorderAdded: Recorder<E>
    RecorderRemoved: Recorder<E>
  }> {
  providers: P[]
  // TODO: 这个或许可以去掉或者改改，感觉不是很有必要
  getChannelURLMatchedRecorderProviders: (
    this: RecorderManager<ME, P, PE, E>,
    channelURL: string
  ) => P[]

  recorders: Recorder<E>[]
  addRecorder: (
    this: RecorderManager<ME, P, PE, E>,
    opts: RecorderCreateOpts<E>
  ) => Recorder<E>
  removeRecorder: (
    this: RecorderManager<ME, P, PE, E>,
    recorder: Recorder<E>
  ) => void

  autoCheckLiveStatusAndRecord: boolean
  isCheckLoopRunning: boolean
  startCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void
  stopCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void

  savePathRule: string
}

export type RecorderManagerCreateOpts<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE
> = Partial<
  Pick<
    RecorderManager<ME, P, PE, E>,
    'savePathRule' | 'autoCheckLiveStatusAndRecord'
  >
> & {
  providers: P[]
}

export function createRecorderManager<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE
>(
  opts: RecorderManagerCreateOpts<ME, P, PE, E>
): RecorderManager<ME, P, PE, E> {
  const recorders: Recorder<E>[] = []

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

  const manager: RecorderManager<ME, P, PE, E> = {
    ...mitt(),

    providers: opts.providers,
    getChannelURLMatchedRecorderProviders(channelURL) {
      return this.providers.filter((p) => p.matchURL(channelURL))
    },

    recorders,
    addRecorder(opts) {
      const provider = this.providers.find((p) => p.id === opts.providerId)
      if (provider == null)
        throw new Error('Cant find provider ' + opts.providerId)

      // TODO: 因为泛型函数内部是不持有具体泛型的，这里被迫用了 as，没什么好的思路处理，除非
      // provider.createRecorder 能返回 Recorder<PE> 才能进一步优化。
      const recorder = provider.createRecorder(
        R.omit(['providerId'], opts)
      ) as Recorder<E>
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

export function genSavePathFromRule<
  ME extends AnyObject,
  P extends RecorderProvider<AnyObject>,
  PE extends AnyObject,
  E extends AnyObject
>(
  manager: RecorderManager<ME, P, PE, E>,
  recorder: Recorder<E>,
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

export type GetProviderExtra<P> = P extends RecorderProvider<infer E>
  ? E
  : never
