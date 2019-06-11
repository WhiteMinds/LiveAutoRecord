import _ from 'lodash'
import fs from 'fs-extra'
import { Route, UserDataPath, ConfigFilePath, RecordFormat } from 'const'

export default {
  data: {
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
      [Route.RecordHistory]: ['file', 'owner']
    }
  },
  load () {
    if (!fs.pathExistsSync(ConfigFilePath)) return
    let data = fs.readJsonSync(ConfigFilePath)
    _.merge(this.data, data)
  },
  save () {
    fs.outputJsonSync(ConfigFilePath, this.data, { spaces: 2 })
  }
}
