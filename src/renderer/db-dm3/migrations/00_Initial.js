export default {
  up (query, DataTypes) {
    return query.createTable('data', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      value: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      relative_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    })
  },
  down (query, DataTypes) {
    return query.dropTable('data')
  }
}
