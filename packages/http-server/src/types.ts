import { Settings } from '@autorecord/shared'

export type LogFn = (data: unknown) => void

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
}
