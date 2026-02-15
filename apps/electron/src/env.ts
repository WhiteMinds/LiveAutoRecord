import envPaths from 'env-paths'

export const appName = process.env.AppName ?? 'live-auto-record'

export const paths = envPaths(appName, { suffix: '' })
