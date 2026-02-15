# LiveAutoRecord CLI 使用指南

`lar` 是 LiveAutoRecord 的命令行工具，支持管理多平台直播录制任务。直接操作本地 Manager 引擎和数据库，无需启动 HTTP Server。

支持平台：Bilibili（B站）、DouYu（斗鱼）、HuYa（虎牙）、DouYin（抖音）。

---

## 目录

1. [安装与构建](#安装与构建)
2. [全局选项](#全局选项)
3. [命令参考](#命令参考)
   - [resolve](#resolve) — 解析直播间 URL
   - [list](#list) — 列出所有录制器
   - [add](#add) — 添加录制器
   - [remove](#remove) — 删除录制器
   - [status](#status) — 查看录制器状态
   - [start](#start) — 手动启动录制
   - [stop](#stop) — 停止录制
   - [check](#check) — 一次性检查并录制
   - [watch](#watch) — 守护模式持续监控
   - [config](#config) — 查看或修改配置
   - [records](#records) — 查看录制历史
   - [auth](#auth) — 管理平台鉴权
4. [配置路径约定](#配置路径约定)
5. [错误处理说明](#错误处理说明)
6. [与 HTTP Server 的互斥约定](#与-http-server-的互斥约定)

---

## 安装与构建

### 前置依赖

- Node.js >= 18
- pnpm 10（项目使用 pnpm Workspaces + Turborepo）
- FFmpeg（录制功能需要，系统 PATH 中可用即可）

### 构建步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 全量构建（Turborepo 自动拓扑排序）
pnpm build

# 或者只构建 CLI 及其依赖
pnpm dev:cli
```

### 运行

构建完成后，通过 Node.js 直接运行：

```bash
node apps/cli/lib/bin.js --help
```

或者在 `apps/cli` 目录下：

```bash
node lib/bin.js --help
```

> **注意**：当前 CLI 包为 `private: true`，不发布到 npm。未来可能提供全局安装方式。

---

## 全局选项

所有命令均支持以下全局选项：

| 选项            | 说明                                                 |
| --------------- | ---------------------------------------------------- |
| `--json`        | 以结构化 JSON 格式输出，适合程序解析和 AI Agent 调用 |
| `-V, --version` | 显示版本号                                           |
| `-h, --help`    | 显示帮助信息                                         |

### `--json` 模式说明

启用 `--json` 后，所有人类可读的日志输出将被静默，仅通过 `stdout` 输出结构化 JSON。

**成功响应格式**：

```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应格式**：

```json
{
  "success": false,
  "error": "错误信息描述"
}
```

`watch` 命令在 `--json` 模式下使用 NDJSON（Newline Delimited JSON），每行一个独立的 JSON 对象，便于流式消费。

---

## 命令参考

---

### resolve

解析直播间 URL，返回平台和频道信息。不需要初始化数据库，执行速度最快。

**语法**：

```
lar resolve <url>
```

**参数**：

| 参数  | 必填 | 说明       |
| ----- | ---- | ---------- |
| `url` | 是   | 直播间 URL |

**支持的 URL 格式**：

| 平台     | URL 格式                              |
| -------- | ------------------------------------- |
| Bilibili | `https://live.bilibili.com/<room_id>` |
| DouYu    | `https://www.douyu.com/<room_id>`     |
| HuYa     | `https://www.huya.com/<room_id>`      |
| DouYin   | `https://live.douyin.com/<room_id>`   |

**示例**：

```bash
# 解析 B站直播间
lar resolve https://live.bilibili.com/12345

# JSON 输出
lar resolve https://www.douyu.com/288016 --json
```

**普通输出**：

```
┌──────────┬──────────────────────┐
│ Field    │ Value                │
├──────────┼──────────────────────┤
│ Platform │ Bilibili (bilibili)  │
│ Channel  │ 12345                │
│ Title    │ 直播间标题           │
│ Owner    │ 主播名称             │
└──────────┴──────────────────────┘
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "providerId": "bilibili",
    "providerName": "Bilibili",
    "channelId": "12345",
    "title": "直播间标题",
    "owner": "主播名称"
  }
}
```

---

### list

列出所有已添加的录制器。别名：`ls`。

**语法**：

```
lar list
lar ls
```

**参数**：无

**示例**：

```bash
# 表格输出
lar list

# JSON 输出
lar ls --json
```

**普通输出**：

```
┌────┬──────────┬─────────┬──────────┬───────┬───────────┐
│ ID │ Platform │ Channel │ Remarks  │ State │ AutoCheck │
├────┼──────────┼─────────┼──────────┼───────┼───────────┤
│ 1  │ bilibili │ 12345   │ 主播A    │ idle  │ true      │
│ 2  │ douyu    │ 288016  │ 主播B    │ idle  │ true      │
└────┴──────────┴─────────┴──────────┴───────┴───────────┘
```

无录制器时输出：`No recorders found. Use "lar add <url>" to add one.`

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "platform": "bilibili",
      "channelId": "12345",
      "remarks": "主播A",
      "state": "idle",
      "autoCheck": true
    }
  ]
}
```

`state` 可能的值：`"idle"` | `"recording"` | `"stopping-record"`

---

### add

添加一个新的录制器。自动解析 URL 获取频道信息，检测重复后写入数据库。

**语法**：

```
lar add <url> [options]
```

**参数**：

| 参数  | 必填 | 说明       |
| ----- | ---- | ---------- |
| `url` | 是   | 直播间 URL |

**选项**：

| 选项                      | 说明                 | 默认值           |
| ------------------------- | -------------------- | ---------------- |
| `-r, --remarks <remarks>` | 录制器备注名称       | 自动使用主播名称 |
| `--no-auto-check`         | 禁用自动直播状态检测 | 默认启用         |
| `-q, --quality <quality>` | 画质选择             | `highest`        |

**画质可选值**：`lowest`, `low`, `medium`, `high`, `highest`

**示例**：

```bash
# 基本添加（自动使用主播名作为备注）
lar add https://live.bilibili.com/12345

# 指定备注和画质
lar add https://www.douyu.com/288016 -r "我的主播" -q high

# 禁用自动检测，JSON 输出
lar add https://www.huya.com/667812 --no-auto-check --json
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "id": "3",
    "providerId": "bilibili",
    "channelId": "12345",
    "remarks": "主播名称",
    "quality": "highest",
    "disableAutoCheck": false
  }
}
```

**错误场景**：

- URL 无法匹配任何平台：提示支持的平台列表
- 相同频道已存在录制器：提示已有录制器的 ID
- 无效画质值：提示可选值列表

---

### remove

按 ID 删除录制器。别名：`rm`。

**语法**：

```
lar remove <id>
lar rm <id>
```

**参数**：

| 参数 | 必填 | 说明                              |
| ---- | ---- | --------------------------------- |
| `id` | 是   | 录制器 ID（通过 `lar list` 查看） |

**示例**：

```bash
# 删除 ID 为 29 的录制器
lar remove 29

# JSON 输出
lar rm 29 --json
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "id": "29"
  }
}
```

**错误场景**：

- ID 不存在：提示运行 `lar list` 查看可用 ID

---

### status

查看录制器的详细状态。不指定 ID 时显示所有录制器概览，指定 ID 时显示单个录制器的完整详情。

**语法**：

```
lar status [id]
```

**参数**：

| 参数 | 必填 | 说明                      |
| ---- | ---- | ------------------------- |
| `id` | 否   | 录制器 ID。省略则显示全部 |

**示例**：

```bash
# 所有录制器概览
lar status

# 单个录制器详情
lar status 29

# JSON 输出
lar status 29 --json
```

**概览模式（无 ID）JSON 输出 Schema**：

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "platform": "bilibili",
      "channelId": "12345",
      "remarks": "主播A",
      "state": "idle",
      "quality": "highest",
      "autoCheck": true,
      "recording": false
    }
  ]
}
```

**详情模式（指定 ID）JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "id": "29",
    "providerId": "bilibili",
    "channelId": "12345",
    "channelURL": "https://live.bilibili.com/12345",
    "remarks": "主播A",
    "state": "recording",
    "quality": "highest",
    "disableAutoCheck": false,
    "streamPriorities": [],
    "sourcePriorities": [],
    "availableStreams": [],
    "availableSources": [],
    "usedStream": null,
    "usedSource": null,
    "recordHandle": {
      "id": "uuid-string",
      "savePath": "/path/to/recording.mp4",
      "stream": "flv",
      "source": "official",
      "url": "https://..."
    },
    "extra": {
      "createTimestamp": 1707984000000
    }
  }
}
```

`recordHandle` 在未录制时为 `null`。

---

### start

手动触发指定录制器开始录制。会检测直播间是否在线，若在线则启动录制。

**语法**：

```
lar start <id>
```

**参数**：

| 参数 | 必填 | 说明      |
| ---- | ---- | --------- |
| `id` | 是   | 录制器 ID |

**示例**：

```bash
# 手动启动录制
lar start 29

# JSON 输出
lar start 29 --json
```

**JSON 输出 Schema（录制启动成功）**：

```json
{
  "success": true,
  "data": {
    "id": "29",
    "state": "recording",
    "recordHandle": {
      "id": "uuid-string",
      "savePath": "/path/to/recording.mp4",
      "stream": "flv",
      "source": "official"
    }
  }
}
```

**JSON 输出 Schema（主播不在线）**：

```json
{
  "success": true,
  "data": {
    "id": "29",
    "state": "idle",
    "recordHandle": null
  }
}
```

**错误场景**：

- ID 不存在：提示运行 `lar list` 查看可用 ID
- 已在录制中：提示当前录制的文件路径

---

### stop

停止指定录制器的录制。

**语法**：

```
lar stop <id>
```

**参数**：

| 参数 | 必填 | 说明      |
| ---- | ---- | --------- |
| `id` | 是   | 录制器 ID |

**示例**：

```bash
# 停止录制
lar stop 29

# JSON 输出
lar stop 29 --json
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "id": "29",
    "state": "idle"
  }
}
```

**错误场景**：

- ID 不存在：提示运行 `lar list` 查看可用 ID
- 当前未在录制：提示录制器当前状态

---

### check

执行一轮直播状态检查。检查完成后，若有录制在进行则等待录制结束再退出，否则立即退出。

**语法**：

```
lar check [id]
```

**参数**：

| 参数 | 必填 | 说明                                            |
| ---- | ---- | ----------------------------------------------- |
| `id` | 否   | 录制器 ID。省略则检查所有启用了自动检测的录制器 |

**示例**：

```bash
# 检查所有启用自动检测的录制器
lar check

# 只检查指定录制器
lar check 29

# JSON 输出
lar check --json
```

**行为说明**：

1. 逐个检查录制器的直播状态
2. 若直播在线且未在录制，自动启动录制
3. 所有检查完成后，若有活跃录制，进程保持运行直到录制结束
4. 按 `Ctrl+C` 可优雅停止所有录制并退出

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "1",
        "channelId": "12345",
        "state": "recording",
        "started": true
      },
      {
        "id": "2",
        "channelId": "288016",
        "state": "idle",
        "started": false
      }
    ],
    "activeRecordings": 1
  }
}
```

`started` 表示本次检查是否新启动了录制。`activeRecordings` 为当前活跃录制总数。

---

### watch

启动守护模式，持续监控所有录制器并自动录制。等同于 HTTP Server 的自动检查循环，但在终端前台运行。

**语法**：

```
lar watch
```

**参数**：无

**示例**：

```bash
# 启动守护模式
lar watch

# NDJSON 事件流（适合程序消费）
lar watch --json
```

**行为说明**：

1. 启动前检测 HTTP Server 是否在 8085 端口运行，若运行则拒绝启动（避免并发写入冲突）
2. 启动 Manager 的自动检查循环（`startCheckLoop()`）
3. 持续监控所有启用了自动检测的录制器
4. 按 `Ctrl+C` 优雅退出：停止检查循环 -> 停止所有活跃录制 -> 保存数据库

**普通模式输出**：

```
ℹ Watch mode started. Monitoring 5/8 recorders. Press Ctrl+C to stop.
✔ [RecordStart] 主播A (1) -> /path/to/recording.mp4
ℹ [RecordStop] 主播A (1) reason: stream ended
```

**JSON 模式（NDJSON）事件类型**：

每行一个 JSON 对象，`event` 字段标识事件类型。

**WatchStarted** — 守护模式启动：

```json
{ "event": "WatchStarted", "timestamp": 1707984000000, "data": { "totalRecorders": 8, "activeRecorders": 5 } }
```

**RecordStart** — 录制开始：

```json
{
  "event": "RecordStart",
  "timestamp": 1707984001000,
  "data": {
    "recorderId": "1",
    "channelId": "12345",
    "remarks": "主播A",
    "recordId": "uuid",
    "savePath": "/path/to/file.mp4"
  }
}
```

**RecordStop** — 录制停止：

```json
{
  "event": "RecordStop",
  "timestamp": 1707984500000,
  "data": { "recorderId": "1", "channelId": "12345", "remarks": "主播A", "recordId": "uuid", "reason": "stream ended" }
}
```

**RecorderUpdated** — 录制器属性更新：

```json
{ "event": "RecorderUpdated", "timestamp": 1707984002000, "data": { "recorderId": "1", "updatedKeys": ["state"] } }
```

**WatchStopping** — 正在停止：

```json
{ "event": "WatchStopping", "timestamp": 1707985000000 }
```

**WatchStopped** — 已停止：

```json
{ "event": "WatchStopped", "timestamp": 1707985001000 }
```

---

### config

查看或修改 Manager 配置。直接读写配置文件，不需要初始化 Manager。

**语法**：

```
lar config [key] [value] [options]
```

**参数**：

| 参数    | 必填 | 说明                           |
| ------- | ---- | ------------------------------ |
| `key`   | 否   | 配置项名称。省略则显示所有配置 |
| `value` | 否   | 新值。省略则只读取             |

**选项**：

| 选项      | 说明                 |
| --------- | -------------------- |
| `--reset` | 重置所有配置为默认值 |

**可配置项**：

| 配置项                          | 类型    | 默认值                                                                               | 说明                   |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------ | ---------------------- |
| `savePathRule`                  | string  | `<数据目录>/{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4` | 录制文件保存路径模板   |
| `autoRemoveSystemReservedChars` | boolean | `true`                                                                               | 自动移除系统保留字符   |
| `autoCheckLiveStatusAndRecord`  | boolean | `true`                                                                               | 自动检查直播状态并录制 |
| `autoCheckInterval`             | number  | `1000`                                                                               | 自动检查间隔（毫秒）   |
| `ffmpegOutputArgs`              | string  | FFmpeg 默认参数                                                                      | FFmpeg 输出参数        |

**路径模板可用变量**：`{platform}`, `{owner}`, `{title}`, `{year}`, `{month}`, `{date}`, `{hour}`, `{min}`, `{sec}`

**示例**：

```bash
# 查看所有配置
lar config

# 查看单项
lar config savePathRule

# 修改检查间隔为 30 秒
lar config autoCheckInterval 30000

# 修改保存路径模板
lar config savePathRule "/recordings/{platform}/{owner}/{title}.mp4"

# 重置为默认值
lar config --reset

# JSON 输出
lar config --json
```

**查看所有（JSON 输出 Schema）**：

```json
{
  "success": true,
  "data": {
    "savePathRule": "/path/to/{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4",
    "autoRemoveSystemReservedChars": true,
    "autoCheckLiveStatusAndRecord": true,
    "autoCheckInterval": 1000,
    "ffmpegOutputArgs": "-c copy ..."
  }
}
```

**查看单项（JSON 输出 Schema）**：

```json
{
  "success": true,
  "data": {
    "key": "autoCheckInterval",
    "value": 1000
  }
}
```

**设置（JSON 输出 Schema）**：

```json
{
  "success": true,
  "data": {
    "key": "autoCheckInterval",
    "value": 30000
  }
}
```

**类型校验**：

- `boolean` 类型的值必须输入 `true` 或 `false`
- `number` 类型的值必须输入有效数字
- `string` 类型的值直接作为字符串保存

---

### records

查看录制历史记录。支持按录制器过滤和分页。

**语法**：

```
lar records [options]
```

**选项**：

| 选项                 | 说明             | 默认值         |
| -------------------- | ---------------- | -------------- |
| `--recorder-id <id>` | 按录制器 ID 过滤 | 无（显示全部） |
| `--limit <count>`    | 限制返回条数     | `50`           |
| `--offset <start>`   | 跳过前 N 条      | `0`            |

**示例**：

```bash
# 查看最近 50 条录制记录
lar records

# 按录制器过滤
lar records --recorder-id 29

# 分页：第 51-70 条
lar records --offset 50 --limit 20

# 只看最近 10 条
lar records --limit 10

# JSON 输出
lar records --json
```

**普通输出**：

```
┌──────────┬──────────┬───────────────────────────────┬──────────────────────┬──────────────────────┬──────────┐
│ ID       │ Recorder │ Save Path                     │ Start                │ Stop                 │ Duration │
├──────────┼──────────┼───────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ a1b2c3d4 │ 1        │ .../Bilibili/主播A/2025-...   │ 2025/2/15 20:00:00   │ 2025/2/15 23:30:00   │ 3h30m0s  │
│ e5f6g7h8 │ 2        │ .../DouYu/主播B/2025-...      │ 2025/2/15 19:00:00   │ 2025/2/15 21:00:00   │ 2h0m0s   │
└──────────┴──────────┴───────────────────────────────┴──────────────────────┴──────────────────────┴──────────┘
Showing 2 of 2 records
```

表格中 ID 只显示前 8 位，过长的 Save Path 显示末尾 57 个字符。

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "recorderId": "1",
        "savePath": "/data/live-auto-record/Bilibili/主播A/2025-02-15 20-00-00 直播标题.mp4",
        "startTimestamp": 1707984000000,
        "stopTimestamp": 1707996600000,
        "stopReason": "stream ended"
      }
    ],
    "total": 100,
    "offset": 0,
    "limit": 50
  }
}
```

`stopTimestamp` 和 `stopReason` 在录制进行中时可能不存在。

---

## 配置路径约定

CLI、HTTP Server 和 Electron 客户端共享同一数据目录，通过 `env-paths('live-auto-record', { suffix: '' })` 确定。

### 各平台路径

| 平台        | 配置目录                                 | 数据目录                                         |
| ----------- | ---------------------------------------- | ------------------------------------------------ |
| **Windows** | `%APPDATA%/live-auto-record`             | `%APPDATA%/live-auto-record`                     |
| **Linux**   | `~/.config/live-auto-record`             | `~/.local/share/live-auto-record`                |
| **macOS**   | `~/Library/Preferences/live-auto-record` | `~/Library/Application Support/live-auto-record` |

### 关键文件

| 文件         | 路径                      | 说明                                           |
| ------------ | ------------------------- | ---------------------------------------------- |
| 数据库       | `<数据目录>/data.json`    | 存储录制器列表和录制历史（lowdb JSON）         |
| Manager 配置 | `<配置目录>/manager.json` | Manager 运行参数                               |
| 录制文件     | 由 `savePathRule` 决定    | 默认保存在 `<数据目录>/{platform}/{owner}/` 下 |

### 默认保存路径模板

```
<数据目录>/{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4
```

---

## 错误处理说明

### 退出码

| 退出码 | 含义                                     |
| ------ | ---------------------------------------- |
| `0`    | 成功                                     |
| `1`    | 错误（参数错误、资源未找到、网络错误等） |

### 常见错误及解决方案

| 错误类型           | 错误信息                                                                         | 解决方案                                                     |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **网络错误**       | `Network error while resolving URL. Please check your internet connection.`      | 检查网络连接，确认目标平台可访问                             |
| **URL 不支持**     | `No provider matched the given URL: ...`                                         | 检查 URL 格式，参考 `lar resolve --help` 查看支持的 URL 格式 |
| **ID 不存在**      | `Recorder not found (id: ...). Run "lar list" to see available IDs.`             | 运行 `lar list` 确认正确的 ID                                |
| **重复添加**       | `Recorder already exists for this channel (id: ..., remarks: "...")`             | 该频道已有录制器，无需重复添加                               |
| **已在录制**       | `Recorder is already recording (id: ..., savePath: ...)`                         | 录制器正在录制中，如需重新录制请先 `lar stop`                |
| **未在录制**       | `Recorder is not recording (id: ...). Current state: ...`                        | 录制器当前未在录制                                           |
| **无效画质**       | `Invalid quality "...". Valid values: lowest, low, medium, high, highest`        | 使用正确的画质值                                             |
| **无效配置键**     | `Unknown config key "...". Valid keys: ...`                                      | 使用正确的配置键名                                           |
| **配置值类型错误** | `Value for "..." must be "true" or "false"` / `Value for "..." must be a number` | 按照配置项类型输入正确的值                                   |
| **Server 冲突**    | `HTTP server is running on port 8085. Cannot run watch mode concurrently.`       | 先关闭 HTTP Server 或 Electron 客户端                        |

### JSON 模式的错误输出

所有错误在 `--json` 模式下统一为：

```json
{
  "success": false,
  "error": "具体的错误信息"
}
```

进程退出码为 `1`，便于脚本通过 `$?` 判断执行结果。

---

## 与 HTTP Server 的互斥约定

LiveAutoRecord 的数据持久化基于 JSON 文件（lowdb），**不支持多实例并发写入**。CLI、HTTP Server、Electron 客户端三者共享同一数据目录。

### 规则

| 操作类型 | CLI 命令                                                                        | 与 Server 共存 | 说明                                               |
| -------- | ------------------------------------------------------------------------------- | -------------- | -------------------------------------------------- |
| **只读** | `list`, `status`, `records`, `resolve`, `auth list`                             | 安全           | 只读取文件，无写入冲突                             |
| **写入** | `add`, `remove`, `config set`, `start`, `stop`, `check`, `auth set/login/clear` | 可能冲突       | 写入数据库或配置文件                               |
| **守护** | `watch`                                                                         | 禁止           | 启动前自动检测 8085 端口，若 Server 运行则拒绝启动 |

### 检测机制

`watch` 命令启动时会尝试连接 `http://localhost:8085/api/manager`（超时 1 秒）：

- **连接成功**：说明 HTTP Server 或 Electron 客户端正在运行，拒绝启动并提示用户
- **连接失败**：安全，正常启动守护模式

### 推荐用法

- **开发/调试**：使用 CLI 的 `watch` 命令，轻量且可直接查看终端输出
- **生产部署**：使用 HTTP Server + Web UI，提供完整的管理界面
- **临时操作**：使用 `check` 命令执行一次检查后退出（适合 cron job）
- **脚本自动化**：所有命令加 `--json` 选项，通过 `jq` 等工具解析输出

---

## 实现说明

本节记录 CLI 的关键设计决策和内部实现细节，供开发者参考。

### 设计决策

- **Standalone 优先**：CLI 直接导入 `@autorecord/manager` + 4 个平台 Recorder Provider，无 HTTP 层开销。`resolve` 命令甚至不调用 `initManager()`，仅使用 `providers`，启动最快
- **命令名 `lar`**：匹配项目缩写 LAR（Live Auto Record）
- **CLI 是短命进程**：与 HTTP Server 的长驻进程不同，CLI 使用显式 `saveDB()` 调用（而非 `asyncThrottle` 自动保存），确保进程退出前数据写盘
- **`initManager()` 幂等保护**：内部 `initialized` 标志防止多次初始化，不启动 checkLoop（由 `watch` 命令自行控制）
- **`enableRecordEvents()` 幂等保护**：`start`/`stop`/`check`/`watch` 命令共享此函数注册录制事件处理，多次调用无副作用

### 构建配置

- **仅输出 ESM**：CLI 包为 `private: true`，不被外部 CJS 消费者 require，因此只需 ESM 输出
- **tsup shebang 注入**：通过 tsup `banner` 配置为 `bin.ts` 入口注入 `#!/usr/bin/env node`
- **双入口**：`bin.ts`（CLI 可执行入口，`package.json` 的 `bin` 字段指向）+ `index.ts`（库导出入口，供其他包 import）

### 输出模式内部实现

- **分离策略**：`logger`（consola 实例）负责面向人类的彩色日志输出；`outputJson()` / `outputTable()` 负责结构化数据输出到 stdout
- **JSON 模式静默**：启用 `--json` 时，consola 的 `level` 被设为 `-999`，彻底静默所有日志，仅 `outputJson()` 写入 stdout
- **NDJSON**：`watch` 命令的 JSON 模式使用 Newline Delimited JSON，每行一个事件对象，便于流式消费

### 并发安全分类

| 类型     | 命令                                                                                    | 说明                                     |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| **只读** | `list`, `status`, `records`, `resolve`, `config`（无 value）, `auth list`               | 安全，直接读文件                         |
| **写入** | `add`, `remove`, `config`（有 value）, `start`, `stop`, `check`, `auth set/login/clear` | 与 Server 并发时可能冲突                 |
| **守护** | `watch`                                                                                 | 启动前自动检测 8085 端口，与 Server 互斥 |

### 关键依赖选型

| 依赖                    | 版本 | 选型理由                                         |
| ----------------------- | ---- | ------------------------------------------------ |
| `commander`             | ^14  | 零依赖，TypeScript 友好，ESM 支持良好            |
| `consola`               | ^3   | UnJS 出品，替代 chalk + ora，内置 spinner 和颜色 |
| `console-table-printer` | ^2   | TypeScript 编写，ESM 友好，表格输出              |

### 未来工作

- **Shell 补全**（bash/zsh/fish）：需评估 `tabtab` 或 commander 内置 completion 方案

---

### auth

管理平台鉴权（Cookie 登录）。支持手动设置 Cookie、浏览器扫码登录、查看和清除鉴权状态。

鉴权配置存储在 Provider 级别，同一平台的所有录制器共享同一份 Cookie。设置后 API 请求和 FFmpeg 下载均会携带 Cookie，用于获取原画等高画质直播流。

**语法**：

```
lar auth list
lar auth set <provider> [options]
lar auth login <provider>
lar auth clear <provider>
```

#### auth list

列出所有 Provider 的鉴权状态。

**示例**：

```bash
# 表格输出
lar auth list

# JSON 输出
lar auth list --json
```

**普通输出**：

```
┌──────────┬──────────────┬───────────────┬──────────────┐
│ Provider │ Auth Support │ Authenticated │ Info         │
├──────────┼──────────────┼───────────────┼──────────────┤
│ Bilibili │ true         │ true          │ 用户名       │
│ DouYu    │ false        │ false         │              │
│ HuYa     │ false        │ false         │              │
│ DouYin   │ false        │ false         │              │
└──────────┴──────────────┴───────────────┴──────────────┘
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": [
    {
      "id": "Bilibili",
      "name": "Bilibili",
      "hasAuth": true,
      "isAuthenticated": true,
      "description": "用户名"
    }
  ]
}
```

#### auth set

手动设置 Provider 的鉴权配置。

**选项**：

| 选项                | 说明          |
| ------------------- | ------------- |
| `--cookie <cookie>` | Cookie 字符串 |

**示例**：

```bash
# 设置 B站 Cookie
lar auth set Bilibili --cookie "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx"

# JSON 输出
lar auth set Bilibili --cookie "SESSDATA=xxx" --json
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "description": "用户名"
  }
}
```

#### auth login

通过浏览器扫码登录（需要 Playwright）。命令会打开一个 Chromium 浏览器窗口，导航到平台的登录页面，用户完成登录后自动提取 Cookie 并保存。

**前置依赖**：

```bash
pnpm add playwright
npx playwright install chromium
```

**示例**：

```bash
# 浏览器登录 B站
lar auth login Bilibili
```

登录流程：

1. 打开 Chromium 浏览器（非无头模式）
2. 导航到 `https://passport.bilibili.com/login`
3. 用户扫码或输入账号密码登录
4. 程序每秒检查 Cookie，发现 `SESSDATA` 后自动提取并保存
5. 浏览器自动关闭，显示登录结果
6. 超时时间为 5 分钟

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "description": "用户名"
  }
}
```

**错误场景**：

- Provider 不存在：提示可用的 Provider 列表
- Provider 不支持浏览器登录：提示不支持
- Playwright 未安装：提示安装命令
- 登录超时（5 分钟）：提示超时
- 用户关闭浏览器窗口：提示窗口已关闭

#### auth clear

清除指定 Provider 的鉴权配置。

**示例**：

```bash
# 清除 B站鉴权
lar auth clear Bilibili

# JSON 输出
lar auth clear Bilibili --json
```

**JSON 输出 Schema**：

```json
{
  "success": true,
  "data": null
}
```

#### 鉴权配置持久化

鉴权配置保存在 `manager.json` 的 `providerAuthConfigs` 字段中。应用重启后会自动加载并注入到对应 Provider，无需重新登录。

```json
{
  "providerAuthConfigs": {
    "Bilibili": {
      "cookie": "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ..."
    }
  }
}
```

#### 测试计划

**手动 Cookie 测试**：

```bash
# 1. 设置 B站 Cookie
node apps/cli/lib/bin.js auth set Bilibili --cookie "SESSDATA=xxx; bili_jct=xxx"

# 2. 验证登录状态
node apps/cli/lib/bin.js auth list --json

# 3. 录制高画质直播流（设置画质为 highest）
node apps/cli/lib/bin.js add https://live.bilibili.com/12345 -q highest
node apps/cli/lib/bin.js start 1

# 4. 清除鉴权
node apps/cli/lib/bin.js auth clear Bilibili
node apps/cli/lib/bin.js auth list --json
```

**浏览器登录测试**：

```bash
# 1. 安装 Playwright（如未安装）
pnpm add playwright && npx playwright install chromium

# 2. 浏览器登录
node apps/cli/lib/bin.js auth login Bilibili

# 3. 验证登录状态
node apps/cli/lib/bin.js auth list --json
```

**持久化测试**：

```bash
# 1. 设置 Cookie
node apps/cli/lib/bin.js auth set Bilibili --cookie "SESSDATA=xxx"

# 2. 重新启动应用，验证鉴权仍然存在
node apps/cli/lib/bin.js auth list --json
```
