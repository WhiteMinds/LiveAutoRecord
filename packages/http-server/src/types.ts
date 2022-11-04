import { Settings } from '@autorecord/shared'

export interface ServerOpts {
  getSettings: () => Promise<Settings>
  setSettings: (newSettings: Settings) => Promise<Settings>
}
