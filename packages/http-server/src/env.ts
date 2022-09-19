import envPaths from 'env-paths'

// TODO: 后面得改改
export const appName = process.env.AppName ?? 'live-auto-record'

export const paths = envPaths(appName, { suffix: '' })
