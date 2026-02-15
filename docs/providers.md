# 平台录制器插件开发指南

## 1. 概述

LiveAutoRecord 采用插件化架构来支持多个直播平台的录制。每个平台对应一个独立的 npm 包，实现统一的 `RecorderProvider` 接口，由核心调度引擎 `@autorecord/manager` 统一管理。

### 现有平台插件

| 包名 | 平台 | Provider ID | 源码路径 |
|------|------|------------|---------|
| `@autorecord/bilibili-recorder` | B站直播 | `Bilibili` | `packages/bilibili-recorder/` |
| `@autorecord/douyu-recorder` | 斗鱼直播 | `DouYu` | `packages/douyu-recorder/` |
| `@autorecord/huya-recorder` | 虎牙直播 | `HuYa` | `packages/huya-recorder/` |
| `@autorecord/douyin-recorder` | 抖音直播 | `DouYin` | `packages/douyin-recorder/` |

### 核心概念

- **RecorderProvider** — 平台插件的入口对象，负责 URL 匹配、频道信息解析、录制器创建
- **Recorder** — 单个频道的录制器实例，管理录制状态、执行直播检测和录制
- **RecordHandle** — 一次录制操作的句柄，包含流信息和停止方法
- **RecorderManager** — 调度引擎，管理所有 Recorder 实例的自动检查循环

### 依赖关系

```
你的新插件 (my-platform-recorder)
  └── @autorecord/manager  （peerDependency，提供接口定义和工具函数）
```

---

## 2. 创建新插件步骤

### 2.1 包结构模板

在 `packages/` 目录下创建新平台包，目录结构如下：

```
packages/my-platform-recorder/
├── src/
│   ├── index.ts          # 插件入口，导出 provider 对象
│   ├── stream.ts         # 平台 API 封装（获取直播信息和流地址）
│   ├── danmaku.ts        # 弹幕/消息收集（可选）
│   └── utils.ts          # 平台特有工具函数
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### 2.2 实现 RecorderProvider 接口

`RecorderProvider` 接口定义在 `packages/manager/src/manager.ts`（第 11-34 行）：

```typescript
// packages/manager/src/manager.ts
export interface RecorderProvider<E extends AnyObject> {
  // Provider 的唯一 id，最好只由英文 + 数字组成
  id: string
  name: string
  siteURL: string

  // 用基础的域名、路径等方式快速决定一个 URL 是否能匹配此 provider
  matchURL: (this: RecorderProvider<E>, channelURL: string) => boolean

  // 从一个与当前 provider 匹配的 URL 中解析与获取对应频道的一些信息
  resolveChannelInfoFromURL: (
    this: RecorderProvider<E>,
    channelURL: string,
  ) => Promise<{ id: ChannelId; title: string; owner: string } | null>

  // 创建一个新的录制器实例
  createRecorder: (
    this: RecorderProvider<E>,
    opts: Omit<RecorderCreateOpts<E>, 'providerId'>,
  ) => Recorder<E>

  // 从序列化的 JSON 数据还原录制器
  fromJSON: <T extends SerializedRecorder<E>>(
    this: RecorderProvider<E>,
    json: T,
  ) => Recorder<E>

  // 设置 FFmpeg 输出参数（由 manager 在配置变更时调用）
  setFFMPEGOutputArgs: (this: RecorderProvider<E>, args: string[]) => void
}
```

泛型参数 `E` 用于扩展 Recorder 上的额外字段，如果不需要可以传 `{}`。

#### 实现示例

```typescript
// packages/my-platform-recorder/src/index.ts
import { RecorderProvider } from '@autorecord/manager'

export const provider: RecorderProvider<{}> = {
  id: 'MyPlatform',        // 唯一标识，只用英文+数字
  name: 'My平台',           // 显示名称，支持中文
  siteURL: 'https://www.myplatform.com/',

  matchURL(channelURL) {
    return /https?:\/\/(?:.*?\.)?myplatform\.com\//.test(channelURL)
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null

    // 调用平台 API 获取频道信息
    const info = await getChannelInfo(channelURL)
    return {
      id: info.roomId,      // 频道唯一标识（字符串）
      title: info.title,    // 直播间标题
      owner: info.ownerName // 主播名
    }
  },

  createRecorder(opts) {
    return createRecorder({ providerId: provider.id, ...opts })
  },

  fromJSON(recorder) {
    return defaultFromJSON(this, recorder)
  },

  setFFMPEGOutputArgs(args) {
    ffmpegOutputOptions.splice(0, ffmpegOutputOptions.length, ...args)
  },
}
```

#### 各方法说明

| 方法 | 调用时机 | 职责 |
|------|---------|------|
| `matchURL` | 用户添加频道 URL 时 | 用正则匹配域名，判断该 URL 是否属于此平台 |
| `resolveChannelInfoFromURL` | 用户添加频道后 | 调用平台 API，从 URL 中解析出 `id`/`title`/`owner` |
| `createRecorder` | 添加新录制器时 | 创建带 Proxy 的 Recorder 实例 |
| `fromJSON` | 从数据库恢复录制器时 | 一般直接委托 `defaultFromJSON` |
| `setFFMPEGOutputArgs` | manager 配置变更时 | 更新模块级的 FFmpeg 参数数组 |

### 2.3 实现 Recorder（状态管理 + Proxy + checkLiveStatusAndRecord）

`Recorder` 接口定义在 `packages/manager/src/recorder.ts`。每个 Recorder 实例需要：

1. **基于 mitt 的事件系统** — 发射 `RecordStart`、`RecordStop`、`Updated`、`Message`、`DebugLog` 事件
2. **Proxy 包裹** — 拦截属性赋值，自动触发 `Updated` 事件
3. **singleton 包裹的 checkLiveStatusAndRecord** — 确保并发安全

```typescript
import mitt from 'mitt'
import {
  Recorder,
  RecorderCreateOpts,
  defaultToJSON,
  genRecorderUUID,
} from '@autorecord/manager'
import { singleton } from './utils'

function createRecorder(opts: RecorderCreateOpts): Recorder {
  const recorder: Recorder = {
    id: opts.id ?? genRecorderUUID(),
    extra: opts.extra ?? {},
    ...mitt(),
    ...opts,

    // Recorder 自行管理的运行时状态
    availableStreams: [],
    availableSources: [],
    state: 'idle',

    getChannelURL() {
      return `https://www.myplatform.com/${this.channelId}`
    },

    // 用 singleton 包裹，防止重复录制
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this)
    },
  }

  // Proxy 拦截所有属性赋值，自动发射 Updated 事件
  // 这是 manager 感知 Recorder 状态变化的核心机制
  const recorderWithSupportUpdatedEvent = new Proxy(recorder, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value)
      if (typeof prop === 'string') {
        obj.emit('Updated', [prop])
      }
      return true
    },
  })

  return recorderWithSupportUpdatedEvent
}
```

**关键设计说明：**

- `recorder` 对象内部不应直接引用自身（应通过 Proxy 访问），否则会跳过 Proxy 拦截
- `state` 的流转：`'idle'` -> `'recording'` -> `'stopping-record'` -> `'idle'`
- `genRecorderUUID()` 和 `genRecordUUID()` 由 manager 包提供，基于 UUID v4

### 2.4 实现录制流程

`checkLiveStatusAndRecord` 是核心录制方法，完整流程如下：

```
┌────────────────────┐
│ 检查是否已在录制     │ ── 是 ──> 返回已有 recordHandle
└────────┬───────────┘
         │ 否
┌────────▼───────────┐
│ 调用平台 API        │
│ 检查是否正在直播     │ ── 否 ──> 返回 null
└────────┬───────────┘
         │ 是
┌────────▼───────────┐
│ 获取直播流地址       │  （按 quality / streamPriorities / sourcePriorities 选择）
└────────┬───────────┘
┌────────▼───────────┐
│ 确保保存目录存在     │
└────────┬───────────┘
┌────────▼───────────┐
│ 创建 ExtraData      │  （录制元数据 JSON 文件）
│ 控制器              │
└────────┬───────────┘
┌────────▼───────────┐
│ 启动弹幕客户端      │  （可选，受 disableProvideCommentsWhenRecording 控制）
└────────┬───────────┘
┌────────▼───────────┐
│ 构建并启动 FFmpeg   │
│ 录制命令            │
└────────┬───────────┘
┌────────▼───────────┐
│ 构建 RecordHandle   │
│ 发射 RecordStart    │
└────────────────────┘
```

#### 完整实现参考

```typescript
import {
  createFFMPEGBuilder,
  RecordHandle,
  genRecordUUID,
  createRecordExtraDataController,
  Comment,
  GiveGift,
} from '@autorecord/manager'
import { ensureFolderExist, replaceExtName, singleton } from './utils'

// 模块级变量，由 setFFMPEGOutputArgs 更新
const ffmpegOutputOptions: string[] = [
  '-c', 'copy',
  '-movflags', 'frag_keyframe',
  '-min_frag_duration', '60000000',
]

const checkLiveStatusAndRecord: Recorder['checkLiveStatusAndRecord'] =
  async function ({ getSavePath }) {
    // ① 防止重复录制
    if (this.recordHandle != null) return this.recordHandle

    // ② 检查直播状态
    const { living, owner, title } = await getInfo(this.channelId)
    if (!living) return null

    // ③ 进入录制状态
    this.state = 'recording'

    // ④ 获取直播流
    let res
    try {
      res = await getStream({
        channelId: this.channelId,
        quality: this.quality,
        streamPriorities: this.streamPriorities,
        sourcePriorities: this.sourcePriorities,
      })
    } catch (err) {
      this.state = 'idle'
      throw err
    }
    const { currentStream: stream, sources, streams } = res
    this.availableStreams = streams.map((s) => s.name)
    this.availableSources = sources.map((s) => s.name)
    this.usedStream = stream.name
    this.usedSource = stream.source

    // ⑤ 准备保存路径
    const savePath = getSavePath({ owner, title })
    const extraDataSavePath = replaceExtName(savePath, '.json')
    const recordSavePath = savePath
    try {
      ensureFolderExist(extraDataSavePath)
      ensureFolderExist(recordSavePath)
    } catch (err) {
      this.state = 'idle'
      throw err
    }

    // ⑥ 创建录制元数据控制器
    const extraDataController = createRecordExtraDataController(extraDataSavePath)
    extraDataController.setMeta({ title })

    // ⑦ 启动弹幕收集（可选）
    let danmakuClient = null
    if (!this.disableProvideCommentsWhenRecording) {
      danmakuClient = createDanmakuClient(this.channelId, {
        onComment: (msg) => {
          const comment: Comment = {
            type: 'comment',
            timestamp: Date.now(),
            text: msg.text,
            sender: { uid: msg.uid, name: msg.name },
          }
          this.emit('Message', comment)
          extraDataController.addMessage(comment)
        },
        onGift: (msg) => {
          const gift: GiveGift = {
            type: 'give_gift',
            timestamp: Date.now(),
            name: msg.giftName,
            count: msg.count,
            sender: { uid: msg.uid, name: msg.name },
          }
          this.emit('Message', gift)
          extraDataController.addMessage(gift)
        },
      })
    }

    // ⑧ FFmpeg 录制
    let isEnded = false
    const onEnd = (...args: unknown[]) => {
      if (isEnded) return
      isEnded = true
      this.emit('DebugLog', {
        type: 'common',
        text: `ffmpeg end, reason: ${JSON.stringify(args, (_, v) =>
          v instanceof Error ? v.stack : v
        )}`,
      })
      const reason =
        args[0] instanceof Error ? args[0].message : String(args[0])
      this.recordHandle?.stop(reason)
    }

    const isInvalidStream = createInvalidStreamChecker()
    const timeoutChecker = createTimeoutChecker(
      () => onEnd('ffmpeg timeout'),
      10e3, // 10 秒无新帧视为超时
    )

    const command = createFFMPEGBuilder()
      .input(stream.url)
      .addInputOptions(
        '-user_agent',
        'Mozilla/5.0 ...',
        // 根据平台需要添加 Referer 等 headers
        '-headers',
        'Referer: https://www.myplatform.com/',
      )
      .outputOptions(ffmpegOutputOptions)
      .output(recordSavePath)
      .on('error', onEnd)
      .on('end', () => onEnd('finished'))
      .on('stderr', (stderrLine) => {
        this.emit('DebugLog', { type: 'ffmpeg', text: stderrLine as string })
        if (isInvalidStream(stderrLine as string)) {
          onEnd('invalid stream')
        }
      })
      .on('stderr', timeoutChecker.update)

    const ffmpegArgs = command._getArguments()
    extraDataController.setMeta({
      recordStartTimestamp: Date.now(),
      ffmpegArgs,
    })
    command.run()

    // ⑨ 构建停止方法
    const stop = singleton<RecordHandle['stop']>(async (reason?: string) => {
      if (!this.recordHandle) return
      this.state = 'stopping-record'

      timeoutChecker.stop()
      command.kill('SIGINT') // SIGINT 让 ffmpeg 正常结束
      danmakuClient?.close()

      extraDataController.setMeta({ recordStopTimestamp: Date.now() })
      extraDataController.flush()

      this.usedStream = undefined
      this.usedSource = undefined

      this.emit('RecordStop', { recordHandle: this.recordHandle, reason })
      this.recordHandle = undefined
      this.state = 'idle'
    })

    // ⑩ 发射事件
    this.recordHandle = {
      id: genRecordUUID(),
      stream: stream.name,
      source: stream.source,
      url: stream.url,
      ffmpegArgs,
      savePath: recordSavePath,
      stop,
    }
    this.emit('RecordStart', this.recordHandle)

    return this.recordHandle
  }
```

#### 无效流检测器和超时检测器

这两个辅助函数在所有现有插件中都有使用，用于检测流中断：

```typescript
/**
 * 超时检测器：如果 10 秒内 FFmpeg 没有新的 stderr 输出，认为连接已断开
 */
function createTimeoutChecker(
  onTimeout: () => void,
  time: number,
): { update: () => void; stop: () => void } {
  let timer: NodeJS.Timeout | null = null
  let stopped = false

  const update = () => {
    if (stopped) return
    if (timer != null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      onTimeout()
    }, time)
  }
  update()

  return {
    update,
    stop() {
      stopped = true
      if (timer != null) clearTimeout(timer)
      timer = null
    },
  }
}

/**
 * 无效流检测器：如果帧数连续 10 次未变化，或出现 404 错误，认为流无效
 */
function createInvalidStreamChecker(): (ffmpegLogLine: string) => boolean {
  let prevFrame = 0
  let frameUnchangedCount = 0

  return (ffmpegLogLine) => {
    const streamInfo = ffmpegLogLine.match(
      /frame=\s*(\d+) fps=.*? q=.*? size=\s*(\d+)kB time=.*? bitrate=.*? speed=.*?/,
    )
    if (streamInfo != null) {
      const frame = Number(streamInfo[1])
      if (frame === prevFrame) {
        if (++frameUnchangedCount >= 10) return true
      } else {
        prevFrame = frame
        frameUnchangedCount = 0
      }
      return false
    }

    if (ffmpegLogLine.includes('HTTP error 404 Not Found')) return true
    return false
  }
}
```

### 2.5 注册插件

新插件实现完成后，需要在两个位置注册：

#### HTTP Server 侧

文件：`packages/http-server/src/manager.ts`

```typescript
import { provider as providerForMyPlatform } from '@autorecord/my-platform-recorder'

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [
    providerForDouYu,
    providerForBilibili,
    providerForHuYa,
    providerForDouYin,
    providerForMyPlatform,  // <-- 新增
  ],
})
```

#### CLI 侧

文件：`packages/cli/src/core/manager-init.ts`

```typescript
import { provider as providerForMyPlatform } from '@autorecord/my-platform-recorder'

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [
    providerForDouYu,
    providerForBilibili,
    providerForHuYa,
    providerForDouYin,
    providerForMyPlatform,  // <-- 新增
  ],
})
```

同时需要在两个包的 `package.json` 中添加依赖：

```json
{
  "dependencies": {
    "@autorecord/my-platform-recorder": "workspace:^"
  }
}
```

---

## 3. 参考实现：bilibili-recorder 逐方法详解

源文件：`packages/bilibili-recorder/src/index.ts`

### 3.1 provider 对象

```typescript
export const provider: RecorderProvider<{}> = {
  id: 'Bilibili',
  name: 'Bilibili',
  siteURL: 'https://live.bilibili.com/',
  // ...
}
```

- `id` 必须在所有 provider 中唯一，manager 通过此字段查找对应的 provider
- `name` 用于路径模板中的 `{platform}` 变量
- `siteURL` 用于 Web 前端展示

### 3.2 matchURL — URL 匹配

```typescript
matchURL(channelURL) {
  return /https?:\/\/(?:.*?\.)?bilibili.com\//.test(channelURL)
}
```

设计要点：
- 使用宽松正则，兼容子域名（如 `live.bilibili.com`、`www.bilibili.com`）
- 仅做域名级别判断，不做路径校验

### 3.3 resolveChannelInfoFromURL — 解析频道信息

```typescript
async resolveChannelInfoFromURL(channelURL) {
  if (!this.matchURL(channelURL)) return null

  const id = path.basename(new URL(channelURL).pathname)
  const info = await getInfo(id)

  return {
    id: info.roomId.toString(),  // 必须是 string
    title: info.title,
    owner: info.owner,
  }
}
```

设计要点：
- 必须先调用 `this.matchURL` 验证
- `id` 字段（`ChannelId`）必须是字符串类型
- B 站特殊处理：URL 路径中可能是短 ID，需转换为真实房间号

### 3.4 createRecorder — 创建录制器

```typescript
createRecorder(opts) {
  return createRecorder({ providerId: provider.id, ...opts })
}
```

将 `providerId` 注入，委托给内部的 `createRecorder` 函数。

### 3.5 fromJSON — 反序列化

```typescript
fromJSON(recorder) {
  return defaultFromJSON(this, recorder)
}
```

`defaultFromJSON` 由 manager 包提供，内部调用 `provider.createRecorder` 重建实例。

### 3.6 setFFMPEGOutputArgs — 更新 FFmpeg 参数

```typescript
setFFMPEGOutputArgs(args) {
  ffmpegOutputOptions.splice(0, ffmpegOutputOptions.length, ...args)
}
```

通过 `splice` 原地替换数组内容，因为 `ffmpegOutputOptions` 被 FFmpeg 命令构建器引用。

### 3.7 checkLiveStatusAndRecord — 核心录制逻辑

完整代码见 `packages/bilibili-recorder/src/index.ts` 第 60-236 行。关键流程：

1. **防重入**：`if (this.recordHandle != null) return this.recordHandle`
2. **直播检测**：`getInfo()` 调用 B 站 API
3. **流选择**：`getStream()` 根据 quality/streamPriorities/sourcePriorities 选择最优流
4. **路径准备**：调用 `getSavePath()`（由 manager 提供），确保目录存在
5. **弹幕收集**：使用 `blive-message-listener` 库连接 B 站弹幕 WebSocket
6. **FFmpeg 录制**：`createFFMPEGBuilder()` 构建命令，添加 User-Agent 和 Referer
7. **停止处理**：SIGINT 优雅退出，关闭弹幕客户端，刷新元数据

### 3.8 stream.ts — 平台 API 封装

源文件：`packages/bilibili-recorder/src/stream.ts`

提供两个核心函数：

- `getInfo(channelId)` — 返回 `{ living, owner, title, roomId }`
- `getStream(opts)` — 返回 `{ currentStream, sources, streams }`

其中 `getStream` 的流选择逻辑：

1. 先检查 `streamPriorities`，如果有配置，按优先级排序选择
2. 否则按 `quality` 配置，使用 flex-space-between 算法映射到平台的画质列表
3. 对源（CDN）同样按 `sourcePriorities` 选择
4. 返回最终选中流的 URL（`host + base_url + extra`）

---

## 4. package.json 模板

```json
{
  "name": "@autorecord/my-platform-recorder",
  "version": "1.0.0",
  "description": "LAR my-platform recorder implementation",
  "type": "module",
  "main": "./lib/index.cjs",
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js",
      "require": "./lib/index.cjs"
    }
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "yarn run -T tsup",
    "watch": "yarn run -T tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "files": [
    "lib"
  ],
  "repository": "https://github.com/WhiteMinds/LiveAutoRecord",
  "author": "WhiteMind",
  "license": "LGPL",
  "dependencies": {
    "mitt": "^3.0.0"
  },
  "devDependencies": {
    "@autorecord/manager": "workspace:^",
    "@types/node": "*",
    "typescript": "^5.8.0"
  },
  "peerDependencies": {
    "@autorecord/manager": "*"
  }
}
```

### tsup.config.ts 模板

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'lib',
})
```

### tsconfig.json 模板

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./lib",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### 在根 package.json 中注册 workspace

确保根目录的 `package.json` 的 `workspaces` 字段包含新包路径：

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

如果 `packages/*` 已有通配符，无需额外配置。

---

## 5. 注意事项

### 5.1 singleton 防重入

`checkLiveStatusAndRecord` 必须用 `singleton` 包裹。`singleton` 的作用是：当函数已有一个 Promise 在 pending 状态时，后续调用会直接返回同一个 Promise，避免重复录制。

```typescript
// packages/bilibili-recorder/src/utils.ts
export function singleton<Fn extends (...args: any) => Promise<any>>(fn: Fn): Fn {
  let latestPromise: Promise<unknown> | null = null
  return function (...args) {
    if (latestPromise) return latestPromise
    const promise = fn.apply(this, args).finally(() => {
      if (promise === latestPromise) latestPromise = null
    })
    latestPromise = promise
    return promise
  } as Fn
}
```

每个平台插件都自行实现了 `singleton`（复制自 manager 包的工具函数），也可以从 manager 包导入。

### 5.2 路径保障

录制前必须确保保存目录存在，使用 `ensureFolderExist`：

```typescript
export function ensureFolderExist(fileOrFolderPath: string): void {
  const folder = path.dirname(fileOrFolderPath)
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }
}
```

需要对视频文件路径和元数据 JSON 文件路径分别调用。

### 5.3 UUID 生成

- `genRecorderUUID()` — 为 Recorder 实例生成唯一 ID（在 `opts.id` 未提供时使用）
- `genRecordUUID()` — 为每次录制操作生成唯一 ID

两者均基于 `uuid` 包的 v4 实现，定义在 `packages/manager/src/index.ts`。

### 5.4 FFmpeg 参数管理

- 默认输出格式为 fMP4（Fragmented MP4），使用 `-movflags frag_keyframe`
- 模块级 `ffmpegOutputOptions` 数组在 `setFFMPEGOutputArgs` 中被原地修改
- 使用 `createFFMPEGBuilder()` 创建 FFmpeg 命令，它会自动设置 ffmpeg-static 的路径
- 使用 `command.kill('SIGINT')` 优雅停止，不要用 `SIGKILL`

### 5.5 弹幕收集

- 弹幕收集是可选的，受 `this.disableProvideCommentsWhenRecording` 控制
- 弹幕消息通过 `this.emit('Message', comment)` 实时推送给上层
- 同时写入 `RecordExtraDataController` 持久化到 JSON 文件
- 停止录制时必须关闭弹幕客户端，避免内存泄露

### 5.6 错误处理

- 获取流信息失败时，必须将状态重置为 `'idle'`
- FFmpeg 的 `error` 和 `end` 事件都应触发 `stop`
- 使用 `isEnded` 标志防止 `onEnd` 被多次执行
- 超时检测器（10 秒）和无效流检测器（帧数停滞 10 次）提供自动恢复能力

### 5.7 事件模型

Recorder 需要在正确的时机发射以下事件：

| 事件 | 触发时机 | 数据 |
|------|---------|------|
| `RecordStart` | FFmpeg 启动后 | `RecordHandle` |
| `RecordStop` | 录制结束后 | `{ recordHandle, reason }` |
| `Updated` | 任意属性变化时 | 属性名数组（由 Proxy 自动处理） |
| `Message` | 收到弹幕/礼物时 | `Comment \| GiveGift` |
| `DebugLog` | 调试日志 | `{ type: 'common' \| 'ffmpeg', text }` |

### 5.8 构建和测试

```bash
# 构建依赖链
cd packages/shared && yarn build
cd packages/manager && yarn build

# 构建新插件
cd packages/my-platform-recorder && yarn build

# 通过 CLI 快速验证
cd packages/cli && yarn build
node packages/cli/lib/bin.js resolve https://www.myplatform.com/123456
node packages/cli/lib/bin.js add https://www.myplatform.com/123456
node packages/cli/lib/bin.js check 1
```

---

## 附录：关键源文件路径

| 文件 | 说明 |
|------|------|
| `packages/manager/src/manager.ts` | RecorderProvider 接口定义、RecorderManager 实现 |
| `packages/manager/src/recorder.ts` | Recorder / RecordHandle / RecorderCreateOpts 接口定义 |
| `packages/manager/src/common.ts` | ChannelId / Quality / Message / Comment / GiveGift 类型 |
| `packages/manager/src/index.ts` | 导出的工具函数：defaultFromJSON / defaultToJSON / genRecorderUUID / createFFMPEGBuilder |
| `packages/manager/src/record_extra_data_controller.ts` | 录制元数据控制器 |
| `packages/bilibili-recorder/src/index.ts` | B 站插件完整实现（最佳参考） |
| `packages/bilibili-recorder/src/stream.ts` | B 站流获取和选择逻辑 |
| `packages/douyu-recorder/src/index.ts` | 斗鱼插件完整实现（另一种参考风格） |
| `packages/http-server/src/manager.ts` | HTTP Server 侧 provider 注册 |
| `packages/cli/src/core/manager-init.ts` | CLI 侧 provider 注册 |
