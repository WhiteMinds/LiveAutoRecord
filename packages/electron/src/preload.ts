/**
 * 这个文件负责暴露 render 进程提供的接口给 web
 * https://electronjs.org/docs/latest/tutorial/tutorial-preload
 */
import os from 'os'
import { ClientAPI } from '@autorecord/shared'
import { contextBridge } from 'electron'

const clientAPI: ClientAPI = {
  isMacOS() {
    return os.platform() === 'darwin'
  },
}

contextBridge.exposeInMainWorld('clientAPI', clientAPI)
