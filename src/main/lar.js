import storage from './storage'

const defaultConfig = {
  notice: true,
  interval: 10,
  section: -1,
  savePath: '',
  saveName: ''
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
