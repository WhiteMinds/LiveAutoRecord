import humps from 'humps'

export const Route = {
  Record: '',
  RecordHome: '',
  RecordEdit: '',
  RecordAdd: '',
  RecordSetting: ''
}

for (let key in Route) {
  Route[key] = humps.decamelize(key, { separator: '-' })
}
