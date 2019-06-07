import { Platform } from 'const'

export default {
  up (query, DataTypes) {
    return query.createTable('record_logs', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      platform: {
        type: DataTypes.INTEGER,
        defaultValue: Platform.DouYu
      },
      address: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      alias: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      owner: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      title: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      quality: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      circuit: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      repaired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      stopped_at: DataTypes.DATE,
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })
  },
  down (query, DataTypes) {
    return query.dropTable('record_logs')
  }
}
