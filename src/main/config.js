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
      autoCheck: true,
      checkInterval: 10,
      segment: 0,
      saveFolder: `${UserDataPath}\\{platform}\\{alias}`,
      saveName: '{year}-{month}-{date} {hour}-{min}-{sec}',
      saveFormat: RecordFormat.FLV
    },
    hiddenColumns: {
      [Route.Record]: [],
      [Route.RecordHistory]: ['circuit', 'file', 'owner', 'platformCN']
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
