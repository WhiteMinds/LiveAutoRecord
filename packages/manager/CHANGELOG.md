# @autorecord/manager

## 1.3.0

### Minor Changes

- [`3310c80`](https://github.com/WhiteMinds/LiveAutoRecord/commit/3310c80438d6d6051fbc13c3295e1b2afa32d5bb) Thanks [@WhiteMinds](https://github.com/WhiteMinds)! - 新增抖音平台检查频率限制，同一平台的多个直播间在自动检查时会强制保持至少 1 秒的间隔，避免因请求过于密集而被抖音封禁 IP。

## 1.2.0

### Minor Changes

- [`2c59645`](https://github.com/WhiteMinds/LiveAutoRecord/commit/2c59645d9496a8f090d8f329224d67eb2e6ebedc) Thanks [@WhiteMinds](https://github.com/WhiteMinds)! - 升级到 4.9.0
  - feat: ESM 迁移 — 所有 npm 包支持 ESM + CJS 双格式输出
  - feat: 通用 Provider 鉴权接口（authFields / authFlow / setAuth / checkAuth）
  - feat: B站 cookie 鉴权，支持获取原画等高画质直播流
  - feat: 浏览器登录（Electron BrowserWindow / Playwright）
  - feat: Web UI 设置页面鉴权管理
  - feat: CLI `lar auth` 命令（list / set / login / clear）
  - feat: Provider auth HTTP API（GET/PUT/POST/DELETE /providers/:id/auth）
  - fix: 浏览器登录 Promise 竞态条件修复
