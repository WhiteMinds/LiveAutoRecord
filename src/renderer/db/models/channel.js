import platforms from '@/platforms'

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

    // Virtual fields
    status: {
      type: DataTypes.VIRTUAL,
      defaultValue: 0
    }
  })

  // 定义实际的Class
  // =============================================================================

  class Channel extends ModelClass {

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
