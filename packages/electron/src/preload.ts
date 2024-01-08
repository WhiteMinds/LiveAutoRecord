/**
 * 这个文件负责暴露 render 进程提供的接口给 web
 * https://electronjs.org/docs/latest/tutorial/tutorial-preload
 */
import { ClientAPI } from '@autorecord/shared'
import { contextBridge } from 'electron'
import packageJSON from '../package.json'

const clientAPI: ClientAPI = {
  getVersion() {
    return packageJSON.version
  },
}

contextBridge.exposeInMainWorld('clientAPI', clientAPI)
