import envPaths from 'env-paths'

// TODO: 后面得改改，或许应该在 startServer 时注入
export const appName = process.env.AppName ?? 'live-auto-record'

export const paths = envPaths(appName, { suffix: '' })

export const isDebugMode = 'DEBUG_LAR_SERVER' in process.env
