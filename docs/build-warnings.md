# 构建与运行时警告说明

记录当前已知的构建/运行时警告及其消除计划。

## 1. `import.meta` not available with "cjs" output format

**来源**：`packages/http-server` tsup 构建（CJS 格式输出时）

**警告内容**：
```
"import.meta" is not available with the "cjs" output format and will be empty [empty-import-meta]

    src/index.ts:76:22:
      76 │ const isDirectlyRun = import.meta.url
```

**原因**：`http-server/src/index.ts` 中的 `isDirectlyRun` 使用 `import.meta.url` 判断是否被直接运行（`node lib/index.js`）。tsup 同时输出 ESM 和 CJS 两种格式，而 `import.meta` 是 ESM 专有 API，在 CJS 构建中为 `undefined`。

**影响**：无。代码已有空值保护：
```typescript
const isDirectlyRun = import.meta.url
  ? process.argv[1] === fileURLToPath(import.meta.url)
  : false
```
CJS 消费者不会意外启动独立 HTTP 服务。

**消除方案**：
- 方案 A：去掉 CJS 输出（`format: ['esm']`），仅保留 ESM。需确认无 CJS 消费者
- 方案 B：用 tsup 的 `banner` 或 esbuild `define` 在 CJS 构建中替换 `import.meta.url` 为 `undefined`，抑制警告
- 方案 C：不处理，警告无害

## 2. `DEP0060` DeprecationWarning: `util._extend` is deprecated

**来源**：某个第三方依赖内部（通过 `concurrently` 或其传递依赖）

**警告内容**：
```
(node:125408) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated.
Please use Object.assign() instead.
```

**原因**：Node.js 已废弃 `util._extend()`，某个依赖仍在使用。可通过 `node --trace-deprecation` 定位具体调用栈。

**影响**：无。仅为废弃提示，功能不受影响。

**消除方案**：
- 运行 `node --trace-deprecation` 定位具体依赖，升级该依赖到修复版本
- 如果来自 `concurrently`，尝试升级 `concurrently`（当前 ^7.4.0）

## 3. Browserslist: caniuse-lite is outdated

**来源**：Vite renderer 构建（通过 `@babel/preset-env` 或 `autoprefixer` 等）

**警告内容**：
```
Browserslist: caniuse-lite is outdated. Please run:
  npx update-browserslist-db@latest
```

**原因**：`caniuse-lite` 数据库过旧，浏览器兼容性判断可能不够准确。

**影响**：极低。Electron 内嵌 Chromium，renderer 目标浏览器固定。

**消除方案**：
```bash
npx update-browserslist-db@latest
```

## 4. Morgan deprecated default format

**来源**：`packages/http-server` 运行时

**警告内容**：
```
morgan deprecated default format: use combined format
```

**原因**：`morgan()` 使用了已废弃的 `'default'` 格式参数。

**影响**：无。日志格式可能在未来版本移除。

**消除方案**：将 morgan 初始化从 `morgan('default')` 改为 `morgan('combined')` 或其他支持的格式（`'combined'`、`'common'`、`'dev'`、`'short'`、`'tiny'`）。
