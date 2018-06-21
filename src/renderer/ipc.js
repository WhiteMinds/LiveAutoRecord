/*
* 负责和主进程通信, 并实时更新远程数据
* */
import { ipcRenderer } from 'electron'
import IPCResponder from 'electron-ipc-responder'
import { MsgType } from '@/../const'

class RendererIPCResponder extends IPCResponder {
  constructor () {
    super(ipcRenderer.send.bind(ipcRenderer), ipcRenderer.on.bind(ipcRenderer))
  }

  async [MsgType.LAR_Config] () {
    return this.ask(MsgType.LAR_Config)
  }
}

export default {
  remoteData: {
    liveRooms: [],
    larConfig: {}
  },
  async init () {
    this.client = new RendererIPCResponder()
    this.remoteData.larConfig = await this.client[MsgType.LAR_Config]()
  },
  setLARConfig () {
    // this.client.tell
  }
}
