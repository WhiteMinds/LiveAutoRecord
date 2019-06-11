import humps from 'humps'

export const Route = {
  Record: '',
  RecordEdit: '',
  RecordAdd: '',
  RecordSetting: '',
  RecordHistory: '',
  VideoDownload: '',
  VideoProcess: '',
  Setting: '',
  About: '',
  Player: ''
}

for (let key in Route) {
  Route[key] = humps.decamelize(key, { separator: '-' })
}

export const Layout = {
  Plain: 1,
  Sider: 2
}
