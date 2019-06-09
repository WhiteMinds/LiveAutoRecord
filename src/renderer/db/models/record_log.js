import fs from 'fs-extra'
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
    file: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    repaired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stoppedAt: DataTypes.DATE,

    // 虚拟字段
    status: DataTypes.VIRTUAL,
    exist: DataTypes.VIRTUAL
  }, {
    underscored: true
  })

  // 定义实际的Class
  // =============================================================================

  class RecordLog extends ModelClass {

    constructor (...args) {
      super(...args)
      this.status = 0
      this.exist = fs.existsSync(this.file)
    }

    // Static method
    // ===========================================================================

    static findBy (data) {
      return this.findOne({ where: data })
    }

    static findByChannel ({ platform, address } = {}) {
      return RecordLog.findBy({ platform, address })
    }

    // Attributes handle
    // ===========================================================================

    get platformObj () {
      return platforms[this.platform]
    }

    get url () {
      return this.platformObj.getUrl(this.address)
    }

    setStatus (idx, status) {
      let bit = 1 << (idx - 1)
      if (status) {
        this.status = this.status | bit
      } else {
        this.status = this.status & ~bit
      }
    }

    getStatus (idx) {
      let bit = 1 << (idx - 1)
      return (this.status & bit) > 0
    }
  }

  return RecordLog
}
