import Vue from 'vue'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import { IPCMsg } from 'const'

export default new Vue({
  functional: true,
  data () {
    return {
      app: null,
      record: null,
      hiddenColumns: null
    }
  },
  methods: {
    async init () {
      let data = await ipc.callMain(IPCMsg.GetConfig)
      this.setData(data)

      ipc.answerMain(IPCMsg.SetConfig, this.setData)
    },
    async setData (data) {
      Object.assign(this.$data, data)
    },
    async save () {
      await ipc.callMain(IPCMsg.SetConfig, this.$data)
    }
  }
})
