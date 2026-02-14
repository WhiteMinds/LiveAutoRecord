# Electron ESM 升级计划

## 当前状态

项目已完成 CJS → ESM 迁移，但 electron 包有特殊处理：

- **electron 包未设置 `"type": "module"`**，因为 Electron 20.x（内置 Node 16）使用 `require()` 加载主入口，不支持 ESM entry point
- **所有 7 个 tsup 包输出 ESM + CJS 双格式**（`format: ['esm', 'cjs']`），通过 `exports` 的 `import` / `require` 条件路由，保证 Electron 的 CJS 环境和外部 ESM 消费者都能正常工作
- **electron-vite 仍输出 CJS** 给 main/preload 进程，源码中 `__dirname` 无需替换
- **`packages/http-server/src/index.ts`** 的 `isDirectlyRun` 使用 `import.meta.url` 判断，CJS 构建中安全退出（`import.meta.url` 为 `undefined` → 返回 `false`）

## 升级到 Electron 28+ 后的改动

Electron 28（2023-12，基于 Node 18.17+）开始支持 ESM entry point。升级后可执行以下简化：

### 1. electron 包添加 `"type": "module"`

```jsonc
// packages/electron/package.json
{
  "type": "module",
  "main": "./dist/main/index.mjs"  // 或 .js，取决于 electron-vite 输出
}
```

### 2. electron-vite 输出 ESM

确认 electron-vite 版本支持 ESM 输出（electron-vite 2.x+ 应支持），配置 main 进程输出 ESM 格式。

### 3. 替换 `__dirname`

electron 源码中的 `__dirname` 需替换为 ESM 等价写法：

```typescript
// packages/electron/src/index.ts
import { dirname } from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
```

同样处理 `electron.vite.config.ts`。

### 4. JSON import 添加 assertion

```typescript
// packages/electron/src/index.ts & src/preload.ts
import packageJSON from '../package.json' with { type: 'json' }
```

### 5. 可选：去掉 CJS 双格式输出

如果确认不再需要 CJS 消费者（所有环境都是 ESM），可以将 tsup 配置改回仅 ESM：

```typescript
// tsup.config.ts
format: ['esm'],  // 去掉 'cjs'
```

并简化 `exports`：

```jsonc
"exports": {
  ".": {
    "types": "./lib/index.d.ts",
    "import": "./lib/index.js"
  }
}
```

**注意**：如果包发布到 npm 供外部使用（manager、4 个 recorder），保留 CJS 兼容对下游用户更友好。

### 6. 简化 `isDirectlyRun` 判断

去掉 CJS 兼容的空值检查：

```typescript
// packages/http-server/src/index.ts
const isDirectlyRun = process.argv[1] === fileURLToPath(import.meta.url)
```

## 相关 Electron 版本参考

| Electron | Node.js | ESM 支持 |
|----------|---------|----------|
| 20.x | 16.15 | 不支持 ESM entry |
| 28.x | 18.17 | 支持 ESM entry（需 `"type": "module"`） |
| 30.x | 20.11 | 完整 ESM，`import.meta.dirname` 可用 |
| 33.x | 22.x | 同上 |
