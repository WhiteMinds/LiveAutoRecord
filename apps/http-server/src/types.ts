import { Settings } from '@autorecord/shared'
import type { ProviderAuthFlow } from '@autorecord/manager'

export type LogFn = (...dataList: unknown[]) => void

export interface ServerOpts {
  getSettings: () => Promise<Settings>
  setSettings: (newSettings: Settings) => Promise<Settings>
  logger: {
    error: LogFn
    warn: LogFn
    info: LogFn
    debug: LogFn
  }
  ffmpegPath?: string
  /** 执行 Provider 浏览器登录流程的回调，不提供则禁用浏览器登录功能 */
  executeAuthFlow?: (authFlow: ProviderAuthFlow) => Promise<Record<string, string>>
}
