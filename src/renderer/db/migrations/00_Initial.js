export default {
  up (query, DataTypes) {
    return query.createTable('channels', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      platform: DataTypes.INTEGER,
      address: DataTypes.STRING,
      alias: DataTypes.STRING,
      quality: DataTypes.STRING,
      circuit: DataTypes.STRING,
      barrage: DataTypes.BOOLEAN,
      auto_process: DataTypes.BOOLEAN,
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })
  },
  down (query, DataTypes) {
    return query.dropTable('channels')
  }
}
