---
'@autorecord/electron': minor
'@autorecord/douyu-recorder': patch
---

升级到 4.8.0

- feat: 迁移构建系统到 pnpm 10 + Turborepo
- feat: 完成 ESM 迁移，升级 Electron 40 + Vite 7
- feat: 添加 CLI 工具 (`lar` 命令)
- fix: 适配斗鱼 Next.js 页面结构，修复 URL 解析失败
- chore: 添加 husky + lint-staged + prettier 预提交钩子
