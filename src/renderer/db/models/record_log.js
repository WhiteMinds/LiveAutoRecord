import platforms from '@/platforms'
import { Platform } from 'const'

export default (sequelize, DataTypes) => {

  // 定义数据模型
  // =============================================================================

  const ModelClass = sequelize.define('RecordLog', {
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
    stopped_at: DataTypes.DATE
  }, {
    underscored: true
  })

  // 定义实际的Class
  // =============================================================================

  class RecordLog extends ModelClass {

    // Static method
    // ===========================================================================

    static findBy (data) {
      return this.findOne({ where: data })
    }

    static findByChannel ({ platform, address } = {}) {
      return RecordLog.findBy({ platform, address })
    }
  }

  return RecordLog
}
