import path from 'path'
import electron from 'electron'

const app = electron.app || electron.remote.app

export * from './route'
export * from './platform'

export const UserDataPath = app.getPath('userData')
export const ConfigFilePath = path.join(UserDataPath, 'lar_config.json')
export const LogFolderPath = 'logs'
