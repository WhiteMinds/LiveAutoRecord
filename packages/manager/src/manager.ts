import path from 'path'
import mitt, { Emitter } from 'mitt'
import * as R from 'ramda'
import formatTemplate from 'string-template'
import { format as formatDate } from 'date-fns'
import { ChannelId } from './common'
import { RecorderCreateOpts, Recorder, SerializedRecorder, RecordHandle, DebugLog } from './recorder'
import { AnyObject, UnknownObject } from './utils'
import { parseArgsStringToArgv } from 'string-argv'

/** 鉴权字段声明 - Provider 声明它需要哪些鉴权配置 */
export interface ProviderAuthField {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea'
  required?: boolean
  placeholder?: string
  description?: string
}

/** 鉴权验证结果 */
export interface ProviderAuthStatus {
  isAuthenticated: boolean
  /** 人类可读的描述，如 "已登录为: 用户名" */
  description?: string
}

/** 浏览器自动登录流程声明 */
export interface ProviderAuthFlow {
  /** 登录页面 URL */
  loginURL: string
  /** 检查登录结果：传入当前 URL 和 cookies，返回是否成功 + 提取的鉴权配置 */
  checkLoginResult: (data: {
    url: string
    cookies: { name: string; value: string; domain: string; path: string }[]
  }) => { success: boolean; authConfig?: Record<string, string> }
  /** 超时时间（ms），默认 5 分钟 */
  timeout?: number
}

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
    channelURL: string,
  ) => Promise<{
    id: ChannelId
    title: string
    owner: string
  } | null>
  createRecorder: (this: RecorderProvider<E>, opts: Omit<RecorderCreateOpts<E>, 'providerId'>) => Recorder<E>

  fromJSON: <T extends SerializedRecorder<E>>(this: RecorderProvider<E>, json: T) => Recorder<E>

  setFFMPEGOutputArgs: (this: RecorderProvider<E>, args: string[]) => void

  /** 鉴权字段声明（不需要鉴权的 Provider 不设置即可） */
  authFields?: ProviderAuthField[]
  /** 浏览器自动登录流程声明 */
  authFlow?: ProviderAuthFlow
  /** 设置鉴权配置（从持久化存储加载、或用户输入后调用） */
  setAuth?: (this: RecorderProvider<E>, config: Record<string, string>) => void
  /** 验证当前鉴权状态 */
  checkAuth?: (this: RecorderProvider<E>) => Promise<ProviderAuthStatus>

  /**
   * 同一 Provider 下多个录制器检查直播状态时的最小间隔（ms）。
   * 当并发线程连续检查同一平台的多个房间时，如果与上次检查的间隔不足此值，
   * 则会延迟剩余时间后再执行检查，避免因请求过于密集而触发平台反爬。
   */
  minCheckIntervalMs?: number
}

const configurableProps = [
  'savePathRule',
  'autoRemoveSystemReservedChars',
  'autoCheckLiveStatusAndRecord',
  'autoCheckInterval',
  'ffmpegOutputArgs',
] as const
type ConfigurableProp = (typeof configurableProps)[number]
function isConfigurableProp(prop: unknown): prop is ConfigurableProp {
  return configurableProps.includes(prop as any)
}

export interface RecorderManager<
  ME extends UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
> extends Emitter<{
  error: { source: string; err: unknown }
  RecordStart: { recorder: Recorder<E>; recordHandle: RecordHandle }
  RecordStop: { recorder: Recorder<E>; recordHandle: RecordHandle; reason?: string }
  RecorderUpdated: {
    recorder: Recorder<E>
    keys: ((string & {}) | keyof Recorder<E>)[]
  }
  RecorderAdded: Recorder<E>
  RecorderRemoved: Recorder<E>
  RecorderDebugLog: DebugLog & { recorder: Recorder<E> }
  Updated: ConfigurableProp[]
}> {
  providers: P[]
  // TODO: 这个或许可以去掉或者改改，感觉不是很有必要
  getChannelURLMatchedRecorderProviders: (this: RecorderManager<ME, P, PE, E>, channelURL: string) => P[]

  recorders: Recorder<E>[]
  addRecorder: (this: RecorderManager<ME, P, PE, E>, opts: RecorderCreateOpts<E>) => Recorder<E>
  removeRecorder: (this: RecorderManager<ME, P, PE, E>, recorder: Recorder<E>) => void

  autoCheckLiveStatusAndRecord: boolean
  autoCheckInterval: number
  isCheckLoopRunning: boolean
  startCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void
  stopCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void

  savePathRule: string
  autoRemoveSystemReservedChars: boolean
  ffmpegOutputArgs: string
}

export type RecorderManagerCreateOpts<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
> = Partial<Pick<RecorderManager<ME, P, PE, E>, ConfigurableProp>> & {
  providers: P[]
}

export function createRecorderManager<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
>(opts: RecorderManagerCreateOpts<ME, P, PE, E>): RecorderManager<ME, P, PE, E> {
  const recorders: Recorder<E>[] = []

  let checkLoopTimer: NodeJS.Timeout | undefined

  const multiThreadCheck = async (manager: RecorderManager<ME, P, PE, E>) => {
    // TODO: 先用写死的数量，后面改成可以设置的
    const maxThreadCount = 3
    // 这里暂时不打算用 state == recording 来过滤，provider 必须内部自己处理录制过程中的 check，
    // 这样可以防止一些意外调用 checkLiveStatusAndRecord 时出现重复录制。
    const needCheckRecorders = recorders.filter((r) => !r.disableAutoCheck)

    // 记录每个 provider 的下一次可用检查时间，用于在并发线程间强制最小检查间隔，
    // 防止同一平台的多个房间被过于密集地检查而触发反爬。
    const providerNextAvailableTime = new Map<string, number>()

    const checkOnce = async () => {
      const recorder = needCheckRecorders.shift()
      if (recorder == null) return

      const providerId = recorder.toJSON().providerId
      const provider = manager.providers.find((p) => p.id === providerId)

      if (provider?.minCheckIntervalMs != null && provider.minCheckIntervalMs > 0) {
        const now = Date.now()
        const nextAvailable = providerNextAvailableTime.get(providerId) ?? 0
        const waitTime = Math.max(0, nextAvailable - now)
        // 立即预占下一个时间槽，防止其他线程在等待期间取到相同的时间
        providerNextAvailableTime.set(providerId, now + waitTime + provider.minCheckIntervalMs)
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }

      await recorder.checkLiveStatusAndRecord({
        getSavePath(data) {
          return genSavePathFromRule(manager, recorder, data)
        },
      })
    }

    const threads = R.range(0, maxThreadCount).map(async () => {
      while (needCheckRecorders.length > 0) {
        try {
          await checkOnce()
        } catch (err) {
          manager.emit('error', { source: 'checkOnceInThread', err })
        }
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
      if (provider == null) throw new Error('Cant find provider ' + opts.providerId)

      // TODO: 因为泛型函数内部是不持有具体泛型的，这里被迫用了 as，没什么好的思路处理，除非
      // provider.createRecorder 能返回 Recorder<PE> 才能进一步优化。
      const recorder = provider.createRecorder(R.omit(['providerId'], opts)) as Recorder<E>
      this.recorders.push(recorder)

      recorder.on('RecordStart', (recordHandle) => this.emit('RecordStart', { recorder, recordHandle }))
      recorder.on('RecordStop', ({ recordHandle, reason }) =>
        this.emit('RecordStop', { recorder, recordHandle, reason }),
      )
      recorder.on('Updated', (keys) => this.emit('RecorderUpdated', { recorder, keys }))
      recorder.on('DebugLog', (log) => this.emit('RecorderDebugLog', { recorder, ...log }))

      this.emit('RecorderAdded', recorder)

      return recorder
    },
    removeRecorder(recorder) {
      const idx = this.recorders.findIndex((item) => item === recorder)
      if (idx === -1) return
      recorder.recordHandle?.stop('remove recorder')
      this.recorders.splice(idx, 1)
      this.emit('RecorderRemoved', recorder)
    },

    autoCheckLiveStatusAndRecord: opts.autoCheckLiveStatusAndRecord ?? true,
    autoCheckInterval: opts.autoCheckInterval ?? 1000,
    isCheckLoopRunning: false,
    startCheckLoop() {
      if (this.isCheckLoopRunning) return
      this.isCheckLoopRunning = true
      // TODO: emit updated event

      const checkLoop = async () => {
        try {
          await multiThreadCheck(this)
        } catch (err) {
          this.emit('error', { source: 'multiThreadCheck', err })
        } finally {
          if (!this.isCheckLoopRunning) return
          checkLoopTimer = setTimeout(checkLoop, this.autoCheckInterval)
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
      path.join(process.cwd(), '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4'),

    autoRemoveSystemReservedChars: opts.autoRemoveSystemReservedChars ?? true,

    ffmpegOutputArgs:
      opts.ffmpegOutputArgs ??
      '-c copy' +
        /**
         * FragmentMP4 可以边录边播（浏览器原生支持），具有一定的抗损坏能力，录制中 KILL 只会丢失
         * 最后一个片段，而 FLV 格式如果录制中 KILL 了需要手动修复下 keyframes。所以默认使用 fmp4 格式。
         */
        ' -movflags frag_keyframe' +
        /**
         * 浏览器加载 FragmentMP4 会需要先把它所有的 moof boxes 都加载完成后才能播放，
         * 默认的分段时长很小，会产生大量的 moof，导致加载很慢，所以这里设置一个分段的最小时长。
         *
         * TODO: 这个浏览器行为或许是可以优化的，比如试试给 fmp4 在录制完成后设置或者录制过程中实时更新 mvhd.duration。
         * https://stackoverflow.com/questions/55887980/how-to-use-media-source-extension-mse-low-latency-mode
         * https://stackoverflow.com/questions/61803136/ffmpeg-fragmented-mp4-takes-long-time-to-start-playing-on-chrome
         *
         * TODO: 如果浏览器行为无法优化，并且想进一步优化加载速度，可以考虑录制时使用 fmp4，录制完成后再转一次普通 mp4。
         */
        ' -min_frag_duration 60000000',
  }

  const setProvidersFFMPEGOutputArgs = (ffmpegOutputArgs: string) => {
    const args = parseArgsStringToArgv(ffmpegOutputArgs)
    manager.providers.forEach((p) => p.setFFMPEGOutputArgs(args))
  }
  setProvidersFFMPEGOutputArgs(manager.ffmpegOutputArgs)

  const proxyManager = new Proxy(manager, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value)

      if (prop === 'ffmpegOutputArgs') {
        setProvidersFFMPEGOutputArgs(value)
      }

      if (isConfigurableProp(prop)) {
        obj.emit('Updated', [prop])
      }

      return true
    },
  })

  return proxyManager
}

export function genSavePathFromRule<
  ME extends AnyObject,
  P extends RecorderProvider<AnyObject>,
  PE extends AnyObject,
  E extends AnyObject,
>(
  manager: RecorderManager<ME, P, PE, E>,
  recorder: Recorder<E>,
  extData: {
    owner: string
    title: string
  },
): string {
  // TODO: 这里随便写的，后面再优化
  const provider = manager.providers.find((p) => p.id === recorder.toJSON().providerId)

  const now = new Date()
  const params = {
    platform: provider?.name ?? 'unknown',
    channelId: recorder.channelId,
    remarks: recorder.remarks ?? '',
    year: formatDate(now, 'yyyy'),
    month: formatDate(now, 'MM'),
    date: formatDate(now, 'dd'),
    hour: formatDate(now, 'HH'),
    min: formatDate(now, 'mm'),
    sec: formatDate(now, 'ss'),
    ...extData,
  }
  if (manager.autoRemoveSystemReservedChars) {
    for (const key in params) {
      params[key] = removeSystemReservedChars(params[key])
    }
  }

  return formatTemplate(manager.savePathRule, params)
}

// TODO: 目前只对 windows 做了处理
function removeSystemReservedChars(filename: string) {
  if (process.platform !== 'win32') return filename

  // Refs: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#naming-conventions
  return filename.replace(/[\\/:*?"<>|]/g, '').replace(/[ .]+$/, '')
}

export type GetProviderExtra<P> = P extends RecorderProvider<infer E> ? E : never
