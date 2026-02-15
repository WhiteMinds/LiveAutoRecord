# Electron CDP 连接注意事项

## 连接方式

Playwright 的 `connectOverCDP` 必须用 `ws://` WebSocket URL，**不能**用 `http://`。

正确做法：先请求 `http://localhost:9222/json/version`，从响应的 `webSocketDebuggerUrl` 字段取得 ws URL，再用它连接。

```
GET http://localhost:9222/json/version
→ { "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/<id>" }
```

```js
const browser = await chromium.connectOverCDP(wsUrl)
```

## 页面枚举

连接后通过 `browser.contexts()[0].pages()` 枚举页面。典型开发模式下会看到：

| 页面 | URL 模式 | 说明 |
|------|----------|------|
| 渲染进程 | `http://localhost:5173/#/...` | 目标页面 |
| DevTools | `devtools://devtools/bundled/...` | 开发工具面板（跳过） |

## 可用能力

通过 CDP 连接后 Playwright 具备完整能力：

- `page.on('console')` — 监听 console 日志
- `page.evaluate(fn)` — 在渲染进程中注入并执行 JS
- `page.screenshot()` — 截图
- `page.locator()` / `page.click()` 等 — DOM 操作
- `page.route()` — 网络拦截

## 端口冲突

如果 9222 端口被占用（如另一个 Chrome 实例），改用 9223 或其他端口。两处需同步修改：
1. `enable-cdp.cjs enable --port <N>`
2. `cdp-connect.cjs --port <N>`

## Electron 版本信息

本项目使用 Electron 40 (Chrome 144)，CDP 协议版本 1.3。
