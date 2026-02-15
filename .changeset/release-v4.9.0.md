---
'@autorecord/manager': minor
'@autorecord/bilibili-recorder': minor
'@autorecord/huya-recorder': minor
'@autorecord/douyin-recorder': minor
'@autorecord/electron': minor
---

升级到 4.9.0

- feat: ESM 迁移 — 所有 npm 包支持 ESM + CJS 双格式输出
- feat: 通用 Provider 鉴权接口（authFields / authFlow / setAuth / checkAuth）
- feat: B站 cookie 鉴权，支持获取原画等高画质直播流
- feat: 浏览器登录（Electron BrowserWindow / Playwright）
- feat: Web UI 设置页面鉴权管理
- feat: CLI `lar auth` 命令（list / set / login / clear）
- feat: Provider auth HTTP API（GET/PUT/POST/DELETE /providers/:id/auth）
- fix: 浏览器登录 Promise 竞态条件修复
