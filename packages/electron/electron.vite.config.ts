import path from 'path'
import { defineConfig } from 'electron-vite'
import webViteConfig from '../web/vite.config'
import { getPackages } from '@lerna/project'

export default defineConfig({
  main: async () => {
    const projectPkgs = await getPackages()
    const projectPkgNames = projectPkgs.map((pkg) => pkg.name)

    return {
      ssr: {
        // 这些包是在 node_modules 中 link 到 packages 下的，rollup 会提供真实路径给
        // 插件以及内部的各个判断逻辑，为了确保它们被正确的当作外部包处理，需要在这里列出来。
        // TODO: 或许要把开发时可能会手动 link 的 @autorecord/{platform}-recorder 也加上。
        external: [...projectPkgNames],
      },
      build: {
        // 这个选项用于避免一些具有 browser 字段的 package 被 vite 认为是错误的。
        // 但也会带来一些副作用，因为 ssr mode != node mode，vite 并没有对 node 做合适的适配。
        // TODO: 说不定用 vite-node 能解决这个问题，之后可以试试。
        ssr: true,
        // n 个 build server 的输出路径不支持相同，所以要设置到不同的文件夹。
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
        {
          name: 'prevent:vite:asset:generateBundle',
          options(opts) {
            const viteAssetPlugin = opts.plugins?.find((p) => p && 'name' in p && p.name === 'vite:asset')
            if (viteAssetPlugin) {
              delete viteAssetPlugin.generateBundle
            }
          },
        },
      ],
    }
  },

  preload: {
    build: {
      outDir: path.join(__dirname, 'dist/preload'),
      rollupOptions: {
        input: path.join(__dirname, 'src/preload.ts'),
      },
      watch: {},
      sourcemap: true,
    },
  },

  renderer: async (env) => {
    const rendererConfig = isPromiseLike(webViteConfig)
      ? await webViteConfig
      : typeof webViteConfig === 'function'
      ? await webViteConfig(env)
      : webViteConfig

    return {
      ...rendererConfig,
      root: path.join(__dirname, '../web'),
      build: {
        ...rendererConfig.build,
        outDir: path.join(__dirname, 'dist/renderer'),
        rollupOptions: {
          ...rendererConfig.build?.rollupOptions,
          input: path.join(__dirname, '../web/index.html'),
        },
      },
    }
  },
})

function isPromiseLike<T>(obj: unknown): obj is PromiseLike<T> {
  return !!obj && typeof obj === 'object' && typeof (obj as any).then === 'function'
}
