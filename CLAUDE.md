# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LiveAutoRecord（LAR）是一个多直播平台自动录制工具，支持斗鱼、B站、虎牙、抖音。提供三种使用方式：Electron 桌面客户端、HTTP 服务端部署、NPM 包引入。

## Monorepo 结构

pnpm 10 Workspaces + Turborepo，`apps/` + `packages/` 分层，包含 11 个包：

| 包                              | 位置                         | 角色                                                               | 发布 |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------ | ---- |
| `@autorecord/manager`           | `packages/manager`           | 核心调度引擎：录制器模型、自动检查循环、FFmpeg 集成                | npm  |
| `@autorecord/shared`            | `packages/shared`            | 内部共享工具：Settings 类型、JSON 文件操作                         | 私有 |
| `@autorecord/core`              | `packages/core`              | CLI 和 Server 共享的核心模块：env-paths、lowdb、类型定义、工具函数 | 私有 |
| `@autorecord/bilibili-recorder` | `packages/bilibili-recorder` | B站平台录制插件                                                    | npm  |
| `@autorecord/douyu-recorder`    | `packages/douyu-recorder`    | 斗鱼平台录制插件                                                   | npm  |
| `@autorecord/huya-recorder`     | `packages/huya-recorder`     | 虎牙平台录制插件                                                   | npm  |
| `@autorecord/douyin-recorder`   | `packages/douyin-recorder`   | 抖音平台录制插件                                                   | npm  |
| `@autorecord/cli`               | `apps/cli`                   | CLI 工具（`lar` 命令），直接操作 manager + DB                      | 私有 |
| `@autorecord/electron`          | `apps/electron`              | Electron 桌面客户端，整合 http-server 与 web                       | 私有 |
| `@autorecord/http-server`       | `apps/http-server`           | Express REST API + SSE 实时推送                                    | 私有 |
| `@autorecord/web`               | `apps/web`                   | Vue 3 + Vite + Vuetify + Tailwind 前端                             | 私有 |

**依赖方向**：recorder 插件 → manager → shared；core → manager + shared；http-server → core + manager + 全部插件 + shared；cli → core + manager + 全部插件 + shared；electron → http-server + shared；web 独立通过 HTTP 与 http-server 通信。

**依赖版本管理**：跨包共享的依赖通过 `pnpm-workspace.yaml` 中的 `catalog` 统一版本，各包用 `"catalog:"` 引用。

## 常用命令

### 开发（Electron 客户端）

```bash
pnpm install
# Turborepo 自动按拓扑排序编译所有依赖，然后并行运行 http-server watch + electron-vite dev
pnpm app:dev
```

### 开发（服务端 + Web）

```bash
pnpm install
pnpm dev:server   # 自动编译依赖 + 启动 http-server（tsup watch）
pnpm dev:web      # Vite dev server
```

### 开发（CLI）

```bash
pnpm install
pnpm dev:cli      # 自动编译所有依赖 + cli
# 运行
node apps/cli/lib/bin.js --help
node apps/cli/lib/bin.js list --json
```

### 构建

```bash
# 全量构建（Turborepo 自动拓扑排序 + 缓存）
pnpm build

# Electron 打包（输出 .exe / .dmg）
pnpm app:build

# 服务端生产部署
pnpm -F @autorecord/http-server build && pnpm -F @autorecord/http-server start
pnpm -F @autorecord/web build   # 通过 nginx 等提供静态文件
```

### 单包编译

```bash
pnpm -F @autorecord/<package-name> build    # TypeScript 编译
pnpm -F @autorecord/<package-name> watch    # 监听模式
```

### 清理

```bash
pnpm clean   # 删除所有 node_modules、lib、dist、.turbo
```

**注意**：目前无测试框架，无测试命令。

## 核心架构

### RecorderProvider 插件系统

每个平台实现 `RecorderProvider<E>` 接口（定义在 manager 包）：

- `matchURL(url)` — URL 匹配判断
- `resolveChannelInfoFromURL(url)` — 解析频道信息
- `createRecorder(opts)` / `fromJSON(json)` — 创建/反序列化录制器
- `setFFMPEGOutputArgs(args)` — 配置 FFmpeg 输出参数

通过 `createRecorderManager({ providers: [...] })` 注册插件。

### Recorder 状态机

状态流转：`idle` → `recording` → `stopping-record` → `idle`

核心方法 `checkLiveStatusAndRecord()` 负责检测直播状态并启动录制。

### RecorderManager 调度

- 多线程检查循环（默认 3 并发线程）
- 可配置检查间隔（`autoCheckInterval`）
- 通过 Proxy 模式拦截配置属性变更并触发 `Updated` 事件
- 事件驱动：`RecordStart`、`RecordStop`、`RecorderUpdated`、`RecorderAdded`、`RecorderRemoved`

### FFmpeg 录制流程

1. 平台 API 获取直播流 URL（按 quality → streamPriorities → sourcePriorities 选择）
2. `fluent-ffmpeg` 构建录制命令，默认 fmp4 格式（`-movflags frag_keyframe`）
3. 监控帧更新检测无效流，10s 超时检测连接卡顿
4. SIGINT 优雅停止，同时关闭弹幕收集

### 数据持久化

- **配置**：JSON 文件存储（env-paths 决定路径，如 `~/.config/live-auto-record/`）
- **数据库**：lowdb（JSON 文件），存储 `recorders` 和 `records` 表
- **录制元数据**：每条录制对应独立 JSON 文件（`RecordExtraData`），包含弹幕/礼物消息
- **保存路径模板**：`{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4`

### Web 前端架构

- Vue 3 `<script setup>` + Pinia 状态管理 + Vue Router
- Vuetify 组件库 + Tailwind CSS
- Axios HTTP 客户端 → Express 后端
- RxJS 处理 SSE 实时事件流
- vue-i18n 国际化（中/英/俄）
- DPlayer 视频播放器

### CLI 架构

- 命令名 `lar`，基于 commander@14 + consola@3 + console-table-printer@2
- 直接导入 manager + 4 个 recorder provider，无需启动 HTTP Server
- 与 http-server/electron 共享同一数据目录（`env-paths('live-auto-record')`），通过 `@autorecord/core` 共享 env/lowdb/类型定义/工具函数
- 所有命令支持 `--json` 全局开关，输出结构化 JSON（Agent 友好）
- 11 个命令：`resolve`、`list`、`add`、`remove`、`status`、`start`、`stop`、`check`、`watch`、`config`、`records`
- 详见 `docs/cli.md`

### Electron 集成

- 内嵌 HTTP Server（localhost:8085）
- electron-vite 三段构建：main、preload、renderer
- ffmpeg-static 提供捆绑的 FFmpeg 二进制
- 系统托盘支持

## 关键工具函数

定义在 manager 包的 `utils.ts` 中，被多处使用：

- `singleton(fn)` — 确保异步函数同时只有一个实例运行
- `asyncThrottle(fn, wait)` — 异步节流
- `asyncDebounce(fn, wait)` — 异步防抖
- `ensureFolderExist(path)` — 确保目录存在

## CI/CD

- `.github/workflows/release.yml`：tag push（`v4.*`）触发，pnpm + Turborepo 自动构建，Windows + macOS 双平台
- `.github/workflows/package_for_test.yml`：push 触发测试打包，上传 artifact 并评论 PR
- CI 使用 `pnpm/action-setup@v4`，自动从 `packageManager` 字段读取 pnpm 版本

## 开发原则

### CLI 优先验证

新功能优先通过 CLI 验证核心逻辑，再构建 UI。CLI 命令应支持 `--json` 输出，使 AI Agent 可以直接调用并解析结果。

### 文档驱动上下文

在 `docs/` 目录维护子系统文档（架构、API、插件开发指南等），项目越大文档上下文越有价值。

## 技术选型规范

在此项目中引入任何新的第三方依赖时，必须遵循以下严格的技术选型流程，以确保代码库的长期可维护性和技术先进性。

### 必要的调研步骤

1. **检查库的维护状态**
   - 访问 GitHub 仓库检查是否标记为 Archived 或 Deprecated
   - 查看最后一次提交时间（超过 6 个月未更新需谨慎）
   - 确认是否有官方迁移指引或替代方案

2. **互联网搜索最新动态**
   - 搜索格式：`[库名] deprecated alternative 2025`
   - 检查官方文档是否有 "Migration Guide" 或 "Deprecation Notice"
   - 查阅技术社区讨论（Reddit、Hacker News、Stack Overflow）

3. **评估技术指标**
   - **社区活跃度：** GitHub Stars、Forks、Contributors 数量
   - **下载量：** npm 周下载量（优先选择 >10k/week 的库）
   - **问题响应速度：** 查看 Issues 和 PR 的响应时间
   - **兼容性：** 是否支持项目使用的 Node.js 版本和框架版本

4. **对比替代方案**
   - 列出至少 2-3 个同类库进行对比
   - 优先选择：官方库 > 社区主流库 > 小众库
   - 考虑长期维护成本和团队学习成本

### 实际案例：Google Gemini API SDK 选择

❌ **错误选择：** `@google/generative-ai`

- 该库已于 2024 年底标记为 deprecated
- 将在 2025 年 11 月 30 日停止更新
- 不支持 Gemini 2.0+ 的新特性

✅ **正确选择：** `@google/genai`

- 2025 年 5 月达到 GA（General Availability）
- 官方推荐的统一 SDK
- 同时支持 Gemini Developer API 和 Vertex AI
- 活跃维护中（最新版本 1.30.0，更新于 4 天前）

**调研来源：**

- [官方文档](https://ai.google.dev/gemini-api/docs/libraries)
- [GitHub 仓库](https://github.com/googleapis/js-genai)
- [Deprecated 仓库说明](https://github.com/google-gemini/deprecated-generative-ai-js)

### 决策检查清单

在 PR 中引入新依赖时，请在描述中回答以下问题：

- [ ] 是否搜索确认该库未被 deprecated？
- [ ] 是否检查了官方推荐的替代方案？
- [ ] 该库最后更新时间是否在 6 个月内？
- [ ] 是否对比了至少 2 个同类库？
- [ ] 是否评估了长期维护成本？

**原则：** 技术债务的源头往往是选型时的疏忽，谨慎选择胜过后期重构。

## 语言

项目文档和代码注释以中文为主，代码本身用英文。
