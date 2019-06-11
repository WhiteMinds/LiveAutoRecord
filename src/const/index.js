import path from 'path'
import electron from 'electron'

const app = electron.app || electron.remote.app

export * from './route'
export * from './platform'
export * from './channel'
export * from './ipc'

export const Dev = process.env.NODE_ENV === 'development'
export const WinURL = Dev ? `http://localhost:${process.env.DEV_PORT || 9080}` : `file://${__dirname}/index.html`

export const UserDataPath = app.getPath('userData')
export const ConfigFilePath = path.join(UserDataPath, 'lar_config.json')
export const LogFolderPath = 'logs'

export const EmptyFn = () => {}

export const RecordFormat = {
  FLV: 'flv',
  MP4: 'mp4',
  MOV: 'mov',
  MKV: 'mkv'
}
