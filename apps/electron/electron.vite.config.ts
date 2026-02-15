import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'electron-vite'
import webViteConfig from '../web/vite.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isPromiseLike<T>(obj: unknown): obj is PromiseLike<T> {
  return !!obj && typeof obj === 'object' && typeof (obj as any).then === 'function'
}

export default defineConfig(async (env) => {
  const rendererConfig = isPromiseLike(webViteConfig)
    ? await webViteConfig
    : typeof webViteConfig === 'function'
    ? await webViteConfig(env)
    : webViteConfig

  return {
    main: {
      build: {
        outDir: path.join(__dirname, 'dist/main'),
        rollupOptions: {
          input: path.join(__dirname, 'src/index.ts'),
        },
        // 启用 main process 的热重载（这个热重载有点冷 🥶）
        watch: {},
        // 为 vscode 等 ide 调试时提供 sourcemap
        sourcemap: true,
        // 由于是在 node 中工作，大部分情况下都应该是文件路径而不是 dataURI。
        assetsInlineLimit: 0,
      },
      plugins: [
        // vite 会在 ssr 模式下移除对 asset 类型的文件输出，这里用有点 hack 的方式阻止它这样做。
        // TODO: 测试 electron-vite v5 是否仍需要此 hack
        {
          name: 'prevent:vite:asset:generateBundle',
          options(opts) {
            const viteAssetPlugin = opts.plugins?.find(
              (p) => p && 'name' in p && p.name === 'vite:asset',
            )
            if (viteAssetPlugin) {
              delete viteAssetPlugin.generateBundle
            }
          },
        },
      ],
    },

    preload: {
      build: {
        outDir: path.join(__dirname, 'dist/preload'),
        rollupOptions: {
          input: path.join(__dirname, 'src/preload.ts'),
          output: {
            format: 'cjs',
            entryFileNames: '[name].js',
          },
        },
        watch: {},
        sourcemap: true,
      },
    },

    renderer: {
      ...rendererConfig,
      root: path.join(__dirname, '../web'),
      build: {
        ...rendererConfig.build,
        outDir: path.join(__dirname, 'dist/renderer'),
        rollupOptions: {
          ...rendererConfig.build?.rollupOptions,
          input: path.join(__dirname, '../web/index.html'),
        },
        // electron-vite 要求这里如果配置了就必须是 chrome，所以这里直接将 web 端的配置覆盖掉。
        target: undefined,
      },
    },
  }
})
