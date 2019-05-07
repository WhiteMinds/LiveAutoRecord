import humps from 'humps'

export const Route = {
  Record: '',
  RecordEdit: '',
  RecordAdd: '',
  RecordSetting: '',
  VideoDownload: '',
  VideoProcess: '',
  About: ''
}

for (let key in Route) {
  Route[key] = humps.decamelize(key, { separator: '-' })
}
