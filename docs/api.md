# LiveAutoRecord HTTP API 参考文档

本文档描述 `@autorecord/http-server` 提供的 REST API 端点，供前端（Web / Electron）和第三方集成开发者使用。

---

## 1. 基础信息

| 项目           | 说明                                                |
| -------------- | --------------------------------------------------- |
| Base URL       | `http://localhost:8085/api`                         |
| 默认端口       | `8085`（可通过环境变量 `PORT` 覆盖）                |
| Content-Type   | `application/json`（请求和响应均为 JSON）           |
| 请求体大小限制 | 32MB                                                |
| CORS           | 默认允许 `http://localhost:5173`（Vite 开发服务器） |

### 统一响应格式

所有 API 端点（除文件下载和 SSE 外）均以如下格式返回响应：

```json
{
  "payload": <响应数据>
}
```

### 分页参数

部分列表接口支持分页，通过 Query 参数传递：

| 参数       | 类型   | 默认值 | 范围     | 说明       |
| ---------- | ------ | ------ | -------- | ---------- |
| `page`     | number | 1      | >= 1     | 页码       |
| `pageSize` | number | 10     | 1 ~ 9999 | 每页条目数 |

分页响应格式：

```json
{
  "payload": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPage": 5,
    "items": [...]
  }
}
```

---

## 2. Recorders 端点

Recorders（录制器）是系统的核心实体，每个 Recorder 对应一个直播频道。

### 2.1 获取录制器列表

```
GET /api/recorders
```

**Query 参数：**

| 参数       | 类型   | 必填 | 说明                |
| ---------- | ------ | ---- | ------------------- |
| `page`     | number | 否   | 页码，默认 1        |
| `pageSize` | number | 否   | 每页条目数，默认 10 |

**响应示例：**

```json
{
  "payload": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "totalPage": 1,
    "items": [
      {
        "id": "1",
        "providerId": "Bilibili",
        "channelId": "12345",
        "remarks": "某主播",
        "disableAutoCheck": false,
        "quality": "highest",
        "streamPriorities": [],
        "sourcePriorities": [],
        "extra": {
          "createTimestamp": 1708000000000
        },
        "availableStreams": ["flv", "hls"],
        "availableSources": ["cn-gotcha01"],
        "usedStream": "flv",
        "usedSource": "cn-gotcha01",
        "state": "recording",
        "channelURL": "https://live.bilibili.com/12345",
        "recordHandle": {
          "id": "rec_abc123",
          "stream": "flv",
          "source": "cn-gotcha01",
          "url": "https://...",
          "savePath": "/data/Bilibili/某主播/2026-02-15 20-00-00 直播标题.mp4"
        }
      }
    ]
  }
}
```

---

### 2.2 获取单个录制器

```
GET /api/recorders/:id
```

**路径参数：**

| 参数 | 类型   | 说明      |
| ---- | ------ | --------- |
| `id` | string | 录制器 ID |

**响应：** `{ "payload": ClientRecorder }`

**错误：** 录制器不存在时抛出 Error('404')。

---

### 2.3 添加录制器

```
POST /api/recorders
```

**请求体：**

| 字段               | 类型     | 必填 | 说明                                                         |
| ------------------ | -------- | ---- | ------------------------------------------------------------ |
| `providerId`       | string   | 是   | 平台 Provider ID（`Bilibili` / `DouYu` / `HuYa` / `DouYin`） |
| `channelId`        | string   | 是   | 频道 ID（平台对应的房间号）                                  |
| `remarks`          | string   | 否   | 备注信息（主播名等）                                         |
| `disableAutoCheck` | boolean  | 否   | 是否禁用自动检查                                             |
| `quality`          | Quality  | 否   | 录制画质偏好                                                 |
| `streamPriorities` | string[] | 否   | 视频流优先级列表                                             |
| `sourcePriorities` | string[] | 否   | 源（CDN）优先级列表                                          |
| `extra`            | object   | 否   | 额外扩展字段                                                 |

**请求示例：**

```json
{
  "providerId": "Bilibili",
  "channelId": "12345",
  "remarks": "某主播",
  "quality": "highest",
  "streamPriorities": [],
  "sourcePriorities": []
}
```

**响应：** `{ "payload": ClientRecorder }`（新创建的录制器，含自动分配的 `id`）

---

### 2.4 更新录制器

```
PATCH /api/recorders/:id
```

**路径参数：**

| 参数 | 类型   | 说明      |
| ---- | ------ | --------- |
| `id` | string | 录制器 ID |

**请求体（部分更新）：**

| 字段               | 类型     | 说明                |
| ------------------ | -------- | ------------------- |
| `remarks`          | string   | 备注信息            |
| `disableAutoCheck` | boolean  | 是否禁用自动检查    |
| `quality`          | Quality  | 录制画质偏好        |
| `streamPriorities` | string[] | 视频流优先级列表    |
| `sourcePriorities` | string[] | 源（CDN）优先级列表 |

**请求示例：**

```json
{
  "remarks": "新备注名",
  "disableAutoCheck": true
}
```

**响应：** `{ "payload": ClientRecorder }`（更新后的录制器）

---

### 2.5 删除录制器

```
DELETE /api/recorders/:id
```

**路径参数：**

| 参数 | 类型   | 说明      |
| ---- | ------ | --------- |
| `id` | string | 录制器 ID |

**响应：** `{ "payload": null }`

> 如果录制器不存在，也返回 `null`，不会报错。

---

### 2.6 手动开始录制

```
POST /api/recorders/:id/start_record
```

触发指定录制器立即检查直播状态并开始录制。如果该录制器已经在录制中，则不会重复启动。

**路径参数：**

| 参数 | 类型   | 说明      |
| ---- | ------ | --------- |
| `id` | string | 录制器 ID |

**响应：** `{ "payload": ClientRecorder }`

**错误：** 录制器不存在时抛出 Error('404')。

---

### 2.7 手动停止录制

```
POST /api/recorders/:id/stop_record
```

停止指定录制器正在进行的录制。如果当前没有录制任务，则不做任何操作直接返回。

**路径参数：**

| 参数 | 类型   | 说明      |
| ---- | ------ | --------- |
| `id` | string | 录制器 ID |

**响应：** `{ "payload": ClientRecorder }`

**错误：** 录制器不存在时抛出 Error('404')。

---

## 3. Records 端点

Records（录制记录）存储每次录制的元数据。

### 3.1 获取录制记录列表

```
GET /api/records
```

**Query 参数：**

| 参数         | 类型   | 必填 | 说明                |
| ------------ | ------ | ---- | ------------------- |
| `page`       | number | 否   | 页码，默认 1        |
| `pageSize`   | number | 否   | 每页条目数，默认 10 |
| `recorderId` | string | 否   | 按录制器 ID 过滤    |

**响应示例：**

```json
{
  "payload": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPage": 3,
    "items": [
      {
        "id": "rec_abc123",
        "recorderId": "1",
        "savePath": "/data/Bilibili/某主播/2026-02-15 20-00-00 直播标题.mp4",
        "startTimestamp": 1708000000000,
        "stopTimestamp": 1708003600000,
        "stopReason": "manual stop",
        "isFileExists": true
      }
    ]
  }
}
```

---

### 3.2 获取单条录制记录

```
GET /api/records/:id
```

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | 录制记录 ID |

**响应：** `{ "payload": ClientRecord }`

**错误：** 记录不存在时抛出 Error('404')。

---

### 3.3 下载录制视频

```
GET /api/records/:id/video
```

直接下载录制的视频文件。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | 录制记录 ID |

**响应：** 视频文件流（通过 `res.download` 返回）。

**错误：** 记录不存在或视频文件不存在时返回 `{ "payload": null }`（HTTP 404）。

---

### 3.4 获取录制附加数据

```
GET /api/records/:id/extra_data
```

返回录制过程中收集的弹幕、礼物等附加数据。附加数据以独立 JSON 文件存储，文件名与视频同名但扩展名为 `.json`。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | 录制记录 ID |

**响应示例：**

```json
{
  "payload": {
    "meta": {
      "title": "直播标题",
      "recordStartTimestamp": 1708000000000,
      "recordStopTimestamp": 1708003600000,
      "ffmpegArgs": ["-c", "copy", "-movflags", "frag_keyframe"]
    },
    "messages": [
      {
        "type": "comment",
        "timestamp": 1708000010000,
        "text": "主播好厉害",
        "sender": {
          "uid": "user123",
          "name": "观众A"
        }
      },
      {
        "type": "give_gift",
        "timestamp": 1708000020000,
        "name": "火箭",
        "count": 1,
        "cost": 500,
        "sender": {
          "name": "观众B"
        }
      }
    ]
  }
}
```

**错误：** 记录或附加数据文件不存在时返回 `{ "payload": null }`（HTTP 404）。

---

### 3.5 生成 SRT 字幕文件

```
POST /api/records/:id/srt
```

基于录制的弹幕数据生成 SRT 字幕文件。字幕文件保存在与视频文件同目录，扩展名为 `.srt`。如果已存在同名 SRT 文件，将被覆盖。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | 录制记录 ID |

**响应示例：**

```json
{
  "payload": "2026-02-15 20-00-00 直播标题.srt"
}
```

> 出于安全考虑，只返回文件名而非完整路径。

**错误：** 记录或附加数据文件不存在时返回 `{ "payload": null }`（HTTP 404）。

---

### 3.6 清理无效录制记录

```
POST /api/records/clear_invalid
```

清理视频文件已不存在的录制记录。

**请求体：**

| 字段         | 类型   | 必填 | 说明                                       |
| ------------ | ------ | ---- | ------------------------------------------ |
| `recorderId` | string | 否   | 仅清理指定录制器的无效记录；不传则清理全部 |

**请求示例：**

```json
{
  "recorderId": "1"
}
```

**响应示例：**

```json
{
  "payload": 5
}
```

> `payload` 为被清理的无效记录数量。

---

## 4. Manager 端点

Manager（管理器）控制全局录制行为，如自动检查、保存路径规则、FFmpeg 参数等。

### 4.1 获取管理器配置

```
GET /api/manager
```

**响应示例：**

```json
{
  "payload": {
    "savePathRule": "/data/{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4",
    "autoRemoveSystemReservedChars": true,
    "autoCheckLiveStatusAndRecord": true,
    "autoCheckInterval": 1000,
    "ffmpegOutputArgs": "-c copy -movflags frag_keyframe -min_frag_duration 60000000"
  }
}
```

---

### 4.2 更新管理器配置

```
PATCH /api/manager
```

**请求体（部分更新）：**

| 字段                            | 类型    | 说明                                                                                                                                                |
| ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `savePathRule`                  | string  | 保存路径模板（支持变量：`{platform}`, `{owner}`, `{channelId}`, `{remarks}`, `{year}`, `{month}`, `{date}`, `{hour}`, `{min}`, `{sec}`, `{title}`） |
| `autoRemoveSystemReservedChars` | boolean | 是否自动移除系统保留字符（Windows 下的 `\/:*?"<>\|` 等）                                                                                            |
| `autoCheckLiveStatusAndRecord`  | boolean | 是否启用自动检查并录制                                                                                                                              |
| `autoCheckInterval`             | number  | 自动检查间隔（毫秒）                                                                                                                                |
| `ffmpegOutputArgs`              | string  | FFmpeg 输出参数                                                                                                                                     |

**请求示例：**

```json
{
  "autoCheckInterval": 5000,
  "autoCheckLiveStatusAndRecord": true
}
```

**响应：** `{ "payload": ManagerConfig }`（更新后的完整配置）

> 修改 `autoCheckLiveStatusAndRecord` 会自动启动或停止检查循环。

---

### 4.3 解析频道信息

```
GET /api/manager/resolve_channel
```

根据直播间 URL 解析出对应平台和频道信息。所有已注册的 Provider 会依次尝试匹配。

**Query 参数：**

| 参数         | 类型   | 必填 | 说明       |
| ------------ | ------ | ---- | ---------- |
| `channelURL` | string | 是   | 直播间 URL |

**请求示例：**

```
GET /api/manager/resolve_channel?channelURL=https://live.bilibili.com/12345
```

**响应示例（匹配成功）：**

```json
{
  "payload": {
    "providerId": "Bilibili",
    "channelId": "12345",
    "owner": "某主播"
  }
}
```

**响应示例（无匹配）：**

```json
{
  "payload": null
}
```

---

### 4.4 获取管理器默认配置

```
GET /api/manager/default
```

返回管理器的默认配置值，可用于前端"恢复默认"功能。

**响应示例：**

```json
{
  "payload": {
    "savePathRule": "/home/user/.local/share/live-auto-record/{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4",
    "autoRemoveSystemReservedChars": true,
    "autoCheckLiveStatusAndRecord": true,
    "autoCheckInterval": 1000,
    "ffmpegOutputArgs": "-c copy -movflags frag_keyframe -min_frag_duration 60000000"
  }
}
```

---

## 5. Settings 端点

Settings（设置）存储应用级别的用户偏好配置。

### 5.1 获取设置

```
GET /api/settings
```

**响应示例：**

```json
{
  "payload": {
    "notExitOnAllWindowsClosed": true,
    "noticeOnRecordStart": true,
    "noticeFormat": "",
    "debugMode": false,
    "autoGenerateSRTOnRecordStop": false,
    "autoRemoveRecordWhenTinySize": false,
    "locale": "zh",
    "sortMode": "default"
  }
}
```

---

### 5.2 更新设置

```
PUT /api/settings
```

**请求体（全量替换）：**

| 字段                           | 类型    | 必填 | 说明                                   |
| ------------------------------ | ------- | ---- | -------------------------------------- |
| `notExitOnAllWindowsClosed`    | boolean | 是   | 关闭所有窗口时不退出（仅 Electron）    |
| `noticeOnRecordStart`          | boolean | 是   | 录制开始时发送通知                     |
| `noticeFormat`                 | string  | 否   | 通知消息格式模板                       |
| `debugMode`                    | boolean | 否   | 是否启用调试模式（输出 FFmpeg 日志等） |
| `autoGenerateSRTOnRecordStop`  | boolean | 否   | 录制停止后自动生成 SRT 字幕            |
| `autoRemoveRecordWhenTinySize` | boolean | 否   | 录制停止后自动删除大小为 0 的文件      |
| `locale`                       | string  | 否   | 界面语言（`zh` / `en` / `ru`）         |
| `sortMode`                     | string  | 否   | 录制器列表排序方式                     |

**请求示例：**

```json
{
  "notExitOnAllWindowsClosed": true,
  "noticeOnRecordStart": true,
  "debugMode": true,
  "autoGenerateSRTOnRecordStop": true,
  "autoRemoveRecordWhenTinySize": true,
  "locale": "zh"
}
```

**响应：** `{ "payload": Settings }`（更新后的设置）

> 更新成功后，服务端会通过 SSE 广播 `settings_change` 事件。

---

## 6. Logger 端点

Logger 端点允许前端将日志发送到服务端统一记录，便于调试。

### 6.1 记录日志

```
POST /api/logger/{level}
```

**路径参数：**

| 参数    | 可选值                              | 说明     |
| ------- | ----------------------------------- | -------- |
| `level` | `error` / `warn` / `info` / `debug` | 日志级别 |

**请求体：**

| 字段   | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| `text` | string | 是   | 日志内容 |

**请求示例：**

```json
{
  "text": "用户点击了某个按钮"
}
```

**响应：** `{ "payload": null }`

> 服务端会以 `[frontend]: <text>` 格式记录该日志。

---

## 7. SSE 实时事件

### 7.1 订阅事件流

```
GET /api/events
```

建立 Server-Sent Events (SSE) 长连接，实时接收服务端事件推送。

**响应头：**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**事件数据格式：**

每条事件以标准 SSE 格式发送：

```
id: <递增ID>
data: <JSON 数据>

```

### 7.2 事件类型

#### `update_recorder`

录制器状态更新时触发（如状态变化、属性修改等）。

```json
{
  "event": "update_recorder",
  "recorder": { ... }
}
```

> 对同一个 `recorderId`，同一 tick 内的多次更新会被防抖合并为一次推送。

#### `add_recorder`

新增录制器时触发。

```json
{
  "event": "add_recorder",
  "recorder": { ... }
}
```

#### `remove_recorder`

删除录制器时触发。

```json
{
  "event": "remove_recorder",
  "id": "1"
}
```

#### `record_start`

录制开始时触发。

```json
{
  "event": "record_start",
  "recorder": { ... }
}
```

#### `settings_change`

设置更新时触发。

```json
{
  "event": "settings_change",
  "settings": { ... }
}
```

### 7.3 前端订阅示例

```javascript
const eventSource = new EventSource('http://localhost:8085/api/events')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  switch (data.event) {
    case 'update_recorder':
      console.log('录制器更新:', data.recorder)
      break
    case 'add_recorder':
      console.log('新增录制器:', data.recorder)
      break
    case 'remove_recorder':
      console.log('删除录制器:', data.id)
      break
    case 'record_start':
      console.log('录制开始:', data.recorder)
      break
    case 'settings_change':
      console.log('设置变更:', data.settings)
      break
  }
}
```

---

## 8. Provider 鉴权端点

Provider 鉴权（Authentication）允许为每个平台配置登录凭据（如 Cookie），以获取更高画质的直播流。鉴权配置在 Provider 级别，同一平台的所有录制器共享同一份凭据。

### 8.1 获取 Provider 列表

```
GET /api/providers
```

返回所有已注册的 Provider 列表，包含鉴权字段声明和浏览器登录支持信息。

**响应示例：**

```json
{
  "payload": [
    {
      "id": "Bilibili",
      "name": "Bilibili",
      "siteURL": "https://live.bilibili.com/",
      "authFields": [
        {
          "key": "cookie",
          "label": "Cookie",
          "type": "textarea",
          "required": false,
          "placeholder": "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ...",
          "description": "从浏览器获取 B站登录 Cookie，用于获取原画等高画质直播流"
        }
      ],
      "hasAuthFlow": true
    },
    {
      "id": "DouYu",
      "name": "DouYu",
      "siteURL": "https://www.douyu.com/"
    }
  ]
}
```

**字段说明：**

| 字段          | 类型                | 说明                                          |
| ------------- | ------------------- | --------------------------------------------- |
| `id`          | string              | Provider 唯一标识                             |
| `name`        | string              | 显示名称                                      |
| `siteURL`     | string              | 平台网址                                      |
| `authFields`  | ProviderAuthField[] | 鉴权字段声明（仅支持鉴权的 Provider 返回）    |
| `hasAuthFlow` | boolean             | 是否支持浏览器自动登录（仅支持时返回 `true`） |

---

### 8.2 获取 Provider 鉴权状态

```
GET /api/providers/:id/auth
```

**路径参数：**

| 参数 | 类型   | 说明                         |
| ---- | ------ | ---------------------------- |
| `id` | string | Provider ID（如 `Bilibili`） |

**响应示例（已登录）：**

```json
{
  "payload": {
    "isAuthenticated": true,
    "description": "用户名"
  }
}
```

**响应示例（未登录）：**

```json
{
  "payload": {
    "isAuthenticated": false
  }
}
```

**错误：** Provider 不存在或不支持鉴权时返回 404。

---

### 8.3 设置 Provider 鉴权配置

```
PUT /api/providers/:id/auth
```

手动设置鉴权配置（如粘贴 Cookie）。设置后会自动验证登录状态并持久化到 `manager.json`。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | Provider ID |

**请求体：**

| 字段     | 类型                     | 必填 | 说明           |
| -------- | ------------------------ | ---- | -------------- |
| `config` | `Record<string, string>` | 是   | 鉴权配置键值对 |

**请求示例：**

```json
{
  "config": {
    "cookie": "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx"
  }
}
```

**响应：** `{ "payload": ProviderAuthStatus }`（包含验证后的登录状态）

---

### 8.4 浏览器登录

```
POST /api/providers/:id/auth/login
```

触发浏览器登录流程。这是一个**长连接请求**，直到用户完成登录或超时（默认 5 分钟）才返回。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | Provider ID |

**响应示例：**

```json
{
  "payload": {
    "authConfig": {
      "cookie": "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ..."
    },
    "status": {
      "isAuthenticated": true,
      "description": "用户名"
    }
  }
}
```

**行为说明：**

- Electron 模式：弹出 `BrowserWindow` 登录窗口
- HTTP Server 独立运行模式：使用 Playwright 打开 Chromium 浏览器
- 如果服务端未配置 `executeAuthFlow` 回调，返回 HTTP 501（Not Implemented）
- 客户端断开连接时（`req.on('close')`），自动取消登录流程并关闭浏览器
- 超时默认 5 分钟

**错误：**

- Provider 不存在或不支持浏览器登录：HTTP 400/404
- 未配置 `executeAuthFlow`：HTTP 501
- 登录超时或用户关闭浏览器：HTTP 500

---

### 8.5 清除 Provider 鉴权

```
DELETE /api/providers/:id/auth
```

清除指定 Provider 的鉴权配置，同时从持久化存储中移除。

**路径参数：**

| 参数 | 类型   | 说明        |
| ---- | ------ | ----------- |
| `id` | string | Provider ID |

**响应：** `{ "payload": null }`

---

## 9. 类型定义

### ClientRecorder

客户端可见的录制器对象，从完整的 `Recorder` 中排除了方法和内部属性。

```typescript
interface ClientRecorder {
  // --- 基础属性 ---
  id: string // 唯一标识
  providerId: string // 平台 Provider ID
  channelId: string // 频道 / 房间号
  remarks?: string // 备注
  disableAutoCheck?: boolean // 是否禁用自动检查
  quality: Quality // 录制画质偏好
  streamPriorities: string[] // 视频流优先级
  sourcePriorities: string[] // 源（CDN）优先级
  extra: {
    createTimestamp: number // 录制器创建时间戳
  }

  // --- 运行时状态 ---
  availableStreams: string[] // 可用视频流列表
  availableSources: string[] // 可用源列表
  usedStream?: string // 当前使用的视频流
  usedSource?: string // 当前使用的源
  state: RecorderState // 状态：'idle' | 'recording' | 'stopping-record'

  // --- 计算属性 ---
  channelURL: string // 完整的频道 URL

  // --- 录制句柄（录制中时存在）---
  recordHandle?: {
    id: string // 本次录制 ID
    stream: string // 使用的流
    source: string // 使用的源
    url: string // 流地址
    ffmpegArgs?: string[] // FFmpeg 参数
    savePath: string // 保存路径
  }
}
```

### ClientRecord

客户端可见的录制记录对象。

```typescript
interface ClientRecord {
  id: string // 录制记录 ID（与 RecordHandle.id 一致）
  recorderId: string // 关联的录制器 ID
  savePath: string // 视频文件保存路径
  startTimestamp: number // 录制开始时间戳（毫秒）
  stopTimestamp?: number // 录制停止时间戳（毫秒）
  stopReason?: string // 停止原因（如 'manual stop'）
  isFileExists?: boolean // 视频文件是否存在（仅列表接口返回）
}
```

### ManagerConfig

管理器配置对象。

```typescript
interface ManagerConfig {
  savePathRule: string // 保存路径模板
  autoRemoveSystemReservedChars: boolean // 自动移除系统保留字符
  autoCheckLiveStatusAndRecord: boolean // 是否自动检查并录制
  autoCheckInterval: number // 自动检查间隔（毫秒）
  ffmpegOutputArgs: string // FFmpeg 输出参数字符串
  providerAuthConfigs?: Record<string, Record<string, string>> // 各 Provider 的鉴权配置
}
```

**保存路径模板变量：**

| 变量          | 说明       | 示例           |
| ------------- | ---------- | -------------- |
| `{platform}`  | 平台名称   | `Bilibili`     |
| `{owner}`     | 主播名     | `某主播`       |
| `{channelId}` | 频道 ID    | `12345`        |
| `{remarks}`   | 录制器备注 | `我的备注`     |
| `{title}`     | 直播标题   | `今天直播标题` |
| `{year}`      | 年份       | `2026`         |
| `{month}`     | 月份       | `02`           |
| `{date}`      | 日期       | `15`           |
| `{hour}`      | 小时       | `20`           |
| `{min}`       | 分钟       | `00`           |
| `{sec}`       | 秒         | `00`           |

### Settings

应用设置对象。

```typescript
interface Settings {
  notExitOnAllWindowsClosed: boolean // 关闭所有窗口时不退出（Electron）
  noticeOnRecordStart: boolean // 录制开始时发送通知
  noticeFormat?: string // 通知消息格式模板
  debugMode?: boolean // 调试模式
  autoGenerateSRTOnRecordStop?: boolean // 录制停止后自动生成 SRT
  autoRemoveRecordWhenTinySize?: boolean // 自动删除空文件录制记录
  locale?: string // 界面语言
  sortMode?: string // 排序方式
}
```

### Quality

录制画质枚举值。

```typescript
type Quality = 'lowest' | 'low' | 'medium' | 'high' | 'highest'
```

### RecorderState

录制器状态枚举值。

```typescript
type RecorderState = 'idle' | 'recording' | 'stopping-record'
```

### RecordExtraData

录制附加数据，包含弹幕和礼物等信息。

```typescript
interface RecordExtraData {
  meta: {
    title?: string // 直播标题
    recordStartTimestamp: number // 录制开始时间戳
    recordStopTimestamp?: number // 录制停止时间戳
    ffmpegArgs?: string[] // FFmpeg 参数
  }
  messages: Message[] // 弹幕/礼物消息数组（按时间戳排序）
}

// 弹幕消息
interface Comment {
  type: 'comment'
  timestamp: number // 时间戳（毫秒）
  text: string // 弹幕文本
  color?: string // 颜色
  sender?: {
    uid?: string
    name: string
    avatar?: string
  }
}

// 礼物消息
interface GiveGift {
  type: 'give_gift'
  timestamp: number // 时间戳（毫秒）
  name: string // 礼物名称
  count: number // 数量
  cost?: number // 价值
  sender?: {
    uid?: string
    name: string
    avatar?: string
  }
}

type Message = Comment | GiveGift
```

### ProviderAuthField

Provider 鉴权字段声明，定义 Provider 需要的鉴权配置项。

```typescript
interface ProviderAuthField {
  key: string // 字段标识（如 "cookie"）
  label: string // 显示标签
  type: 'text' | 'password' | 'textarea' // 输入类型
  required?: boolean // 是否必填
  placeholder?: string // 占位提示
  description?: string // 字段说明
}
```

### ProviderAuthStatus

Provider 鉴权验证结果。

```typescript
interface ProviderAuthStatus {
  isAuthenticated: boolean // 是否已登录
  description?: string // 人类可读描述（如 "已登录为: 用户名"）
}
```

### SSEMessage

SSE 事件消息的联合类型。

```typescript
type SSEMessage =
  | { event: 'update_recorder'; recorder: ClientRecorder }
  | { event: 'add_recorder'; recorder: ClientRecorder }
  | { event: 'remove_recorder'; id: string }
  | { event: 'record_start'; recorder: ClientRecorder }
  | { event: 'settings_change'; settings: Settings }
```
