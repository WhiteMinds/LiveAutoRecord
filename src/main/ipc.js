import { ipcMain } from 'electron'
import IPCResponder from 'electron-ipc-responder'
import { isEmptyObject } from '../util'
import { MsgType } from '../const'
import lar from './lar'

class HostIPCResponder extends IPCResponder {
  constructor (webContents) {
    super(webContents.send.bind(webContents), ipcMain.on.bind(ipcMain))

    this.registerTopic(MsgType.LAR_Config, (val) => {
      if (isEmptyObject(val)) return Promise.resolve(lar.config)
      return lar.setConfig(val)
    })
  }
}

export default {
  init (webContents) {
    this.client = new HostIPCResponder(webContents)
  }
}
