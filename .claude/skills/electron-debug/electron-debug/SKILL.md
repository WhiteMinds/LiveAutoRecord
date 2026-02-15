---
name: electron-debug
description: >
  通过 CDP（Chrome DevTools Protocol）将 Playwright 连接到 LiveAutoRecord 的 Electron 应用，
  实现抓取 console 日志、注入 JS 执行、截图、DOM 交互等自动化调试能力。
  适用场景：调试 Electron 渲染进程问题、捕获 console 输出、自动截图、
  测试运行中 Electron 窗口的 UI 行为，或任何需要对 Electron 窗口进行浏览器自动化的任务。
---

# Electron CDP 调试

通过 Chrome DevTools Protocol 将 Playwright 连接到运行中的 Electron 应用进行调试。

## 前置条件

- 已安装 Playwright（通过 `playwright-skill` 或全局安装均可）
- 9222 端口未被其他进程占用

## 工作流程

### 1. 启用 CDP

```bash
node .claude/skills/electron-debug/electron-debug/scripts/enable-cdp.cjs enable
```

自动在 `apps/electron/src/index.ts` 中插入 `app.commandLine.appendSwitch('remote-debugging-port', '9222')`。修改有标记，可完全还原。

### 2. 启动应用

```bash
pnpm app:dev
```

等待输出中出现 `DevTools listening on ws://127.0.0.1:9222/...`。看到 `listening at http://localhost:8085` 表示 HTTP 服务也已就绪。

### 3. 连接并抓取

从 **playwright-skill 目录**运行脚本（以便正确解析 `require('playwright')`）：

```bash
cd <playwright-skill-dir> && node <project>/.claude/skills/electron-debug/electron-debug/scripts/cdp-connect.cjs \
  --duration 5000 \
  --screenshot /tmp/electron.png \
  --eval "console.log('hello from Playwright')"
```

参数说明：
- `--port <N>` — CDP 端口（默认 9222）
- `--duration <ms>` — 监听 console 消息的时长（默认 5000）
- `--screenshot <path>` — 保存截图的路径
- `--eval <code>` — 在渲染进程中执行的 JS 代码

### 4. 清理

```bash
node .claude/skills/electron-debug/electron-debug/scripts/enable-cdp.cjs disable
```

然后停止 Electron 进程（Windows: `taskkill //F //IM electron.exe`，Unix: `pkill -f electron`）。

**重要：** 调试完成后务必还原 CDP 开关，避免将其提交到仓库。

## 自定义 Playwright 脚本

对于脚本未覆盖的场景，可编写自定义 Playwright 脚本。核心模式：

```js
const { chromium } = require('playwright')

const res = await fetch('http://localhost:9222/json/version')
const { webSocketDebuggerUrl } = await res.json()
const browser = await chromium.connectOverCDP(webSocketDebuggerUrl)

const pages = browser.contexts()[0].pages()
const page = pages.find(p => p.url().includes('localhost:5173'))

// ... 自定义操作 ...

browser.disconnect() // 不要用 browser.close()，否则会关闭 Electron
```

执行方式：`cd <playwright-skill-dir> && node run.js /tmp/my-script.js`

## 常见问题

- **connectOverCDP 返回 "status 400"** — 必须用 `/json/version` 返回的 `ws://` URL，不能直接传 `http://localhost:9222`
- **找不到页面** — 应用可能还没加载完，等待 HTTP 服务日志行出现
- **端口被占用** — 改用 `--port 9223`，`enable-cdp.cjs` 也要传相同端口

更多 CDP 连接细节参见 [references/cdp-notes.md](references/cdp-notes.md)。
