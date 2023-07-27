import path from 'path'
import { paths } from './env'
import { readJSONFileSync, writeJSONFileSync } from './utils'

export interface Settings {
  notExitOnAllWindowsClosed: boolean
  noticeOnRecordStart: boolean
  debugMode?: boolean
}

const settingsConfigPath = path.join(paths.config, 'settings.json')

let settings = readJSONFileSync<Settings>(settingsConfigPath, {
  notExitOnAllWindowsClosed: true,
  noticeOnRecordStart: true,
})

export function getSettings(): Settings {
  return settings
}

export function setSettings(newSettings: Settings): Settings {
  writeJSONFileSync(settingsConfigPath, newSettings)
  settings = newSettings
  return newSettings
}
