export default {
  up (query, DataTypes) {
    return query.addColumn('record_logs', 'file', {
      type: DataTypes.STRING,
      defaultValue: ''
    })
  },
  down (query, DataTypes) {
    return query.removeColumn('record_logs', 'file')
  }
}
