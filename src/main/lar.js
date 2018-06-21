import storage from './storage'
import path from 'path'

const defaultConfig = {
  notice: true,
  interval: 10,
  section: -1,
  savePath: path.join(storage.getDataPath(), '$platform/$room/'),
  saveName: '$t{MM-dd hh:mm:ss}'
}

export default {
  async init () {
    this.config = Object.assign(defaultConfig, await storage.getLARConfig())
    // start check loop
  },
  async setConfig (val) {
    await storage.setLARConfig(val)
  }
}
