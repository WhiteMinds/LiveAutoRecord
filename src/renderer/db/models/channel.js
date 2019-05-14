import platforms from '@/platforms'
import { Platform, ChannelStatus, ChannelStatusPriority } from 'const'

export default (sequelize, DataTypes) => {

  // 定义数据模型
  // =============================================================================

  const ModelClass = sequelize.define('Channel', {
    platform: DataTypes.INTEGER,
    address: DataTypes.STRING,
    alias: DataTypes.STRING,
    quality: DataTypes.STRING,
    circuit: DataTypes.STRING,
    barrage: DataTypes.BOOLEAN,
    auto_process: DataTypes.BOOLEAN,

    // 虚拟字段 (注意, 直接在Channel中定义的属性或getter无法被ORM内置的toJSON转换, 所以需要在表格中展示的内容都在此处定义)
    status: DataTypes.VIRTUAL,
    statusCN: {
      type: DataTypes.VIRTUAL,
      get () {
        for (let i = 0; i < ChannelStatusPriority.length; i++) {
          if (this.getStatus(ChannelStatusPriority[i])) {
            return ChannelStatus[ChannelStatusPriority[i]]
          }
        }
        return '无'
      }
    },
    platformCN: {
      type: DataTypes.VIRTUAL,
      get () {
        return Platform[this.platform]
      }
    }
  })

  // 定义实际的Class
  // =============================================================================

  class Channel extends ModelClass {

    constructor (...args) {
      super(...args)
      // 虚拟字段不支持defaultValue, 要在此处初始化
      this.status = 0
    }

    // Static method
    // ===========================================================================

    static findBy (data) {
      return this.findOne({ where: data })
    }

    static findByChannel (channel) {
      return this.findBy({ channel })
    }

    // Attributes handle
    // ===========================================================================

    get platformObj () {
      return platforms[this.platform]
    }

    get url () {
      return this.platformObj.getUrl(this.address)
    }

    get profile () {
      return `${this.platformCN}-${this.address}`
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

    // Actions
    // ===========================================================================

    // ... codes ...
  }

  return Channel
}
