import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/bin.ts'],
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
    dts: false,
    sourcemap: true,
    clean: true,
    outDir: 'lib',
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: 'lib',
  },
])
