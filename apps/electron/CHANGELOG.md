# @autorecord/electron

## 4.10.0

### Minor Changes

- [`4d5be40`](https://github.com/WhiteMinds/LiveAutoRecord/commit/4d5be40596f797889d2ddca344f464bb30123e1c) Thanks [@WhiteMinds](https://github.com/WhiteMinds)! - feat: 抖音录制器支持带 Cookie 录制，可通过浏览器登录或手动设置 Cookie 获取更高画质直播流

## 4.9.0

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

## 4.8.0

### Minor Changes

- [`c089659`](https://github.com/WhiteMinds/LiveAutoRecord/commit/c0896594fcc272075d6dd1a280e5e64e235877a5) Thanks [@WhiteMinds](https://github.com/WhiteMinds)! - 升级到 4.8.0
  - feat: 迁移构建系统到 pnpm 10 + Turborepo
  - feat: 完成 ESM 迁移，升级 Electron 40 + Vite 7
  - feat: 添加 CLI 工具 (`lar` 命令)
  - fix: 适配斗鱼 Next.js 页面结构，修复 URL 解析失败
  - chore: 添加 husky + lint-staged + prettier 预提交钩子
