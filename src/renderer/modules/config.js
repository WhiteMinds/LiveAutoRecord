import _ from 'lodash'
import fs from 'fs-extra'
import Vue from 'vue'
import { Route, UserDataPath, ConfigFilePath, RecordFormat } from 'const'

export default new Vue({
  functional: true,
  data () {
    return {
      app: {
        minimizeToTaskBar: false
      },
      record: {
        notice: true,
        checkInterval: 10,
        segment: 0,
        // 支持的自定义数据有platform, address, n种时间
        saveFolder: `${UserDataPath}\\{platform}\\{address}`,
        saveName: '{year}-{month}-{date} {hour}-{min}-{sec}',
        saveFormat: RecordFormat.FLV
      },
      hiddenColumns: {
        [Route.Record]: [],
        [Route.RecordHistory]: ['owner', 'file']
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
