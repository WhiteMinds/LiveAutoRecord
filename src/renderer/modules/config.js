import _ from 'lodash'
import fs from 'fs-extra'
import Vue from 'vue'
import { UserDataPath, ConfigFilePath } from 'const'

export default new Vue({
  functional: true,
  data () {
    return {
      record: {
        // 支持的自定义数据有platform, channel, n种时间
        savePath: `${UserDataPath}\\{platform}\\{channel}`,
        saveName: '{year}-{month}-{date} {hour}-{min}-{sec}'
      }
    }
  },
  methods: {
    init () {
      this.load()
    },
    load () {
      if (!fs.pathExistsSync(ConfigFilePath)) return
      let data = fs.readJsonSync(ConfigFilePath)
      _.merge(this.$data, data)
    },
    save () {
      fs.outputJsonSync(ConfigFilePath, this.$data, { spaces: 2 })
    }
  }
})
