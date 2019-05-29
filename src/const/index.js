import path from 'path'
import electron from 'electron'

const app = electron.app || electron.remote.app

export * from './route'
export * from './platform'
export * from './channel'

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
