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

## ~~2. `DEP0060` DeprecationWarning: `util._extend` is deprecated~~

**状态**：已解决（2026-02-15，concurrently 升级到 ^9.0.0）

## ~~3. Browserslist: caniuse-lite is outdated~~

**状态**：已解决（2026-02-15，移除 autoprefixer，Tailwind CSS 4 使用 `@tailwindcss/vite` 插件替代 PostCSS 链）

## 4. Morgan deprecated default format

**来源**：`packages/http-server` 运行时

**警告内容**：
```
morgan deprecated default format: use combined format
```

**原因**：`morgan()` 使用了已废弃的 `'default'` 格式参数。

**影响**：无。日志格式可能在未来版本移除。

**消除方案**：将 morgan 初始化从 `morgan('default')` 改为 `morgan('combined')` 或其他支持的格式（`'combined'`、`'common'`、`'dev'`、`'short'`、`'tiny'`）。
