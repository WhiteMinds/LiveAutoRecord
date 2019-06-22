import _ from 'lodash'
import { Sequelize } from 'sequelize'
import { version } from '@/../../package.json'
import { DM3DataType } from 'const'
const Op = Sequelize.Op

export default (sequelize, DataTypes) => {

  // 定义数据模型
  // =============================================================================

  const ModelClass = sequelize.define('Data', {
    type: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    value: {
      type: DataTypes.STRING,
      defaultValue: '',
      set (val) {
        this._value = val
        this.setDataValue('value', JSON.stringify(val))
      },
      get () {
        if (!this.hasOwnProperty('_value')) {
          let val = this.getDataValue('value') || '{}'
          this._value = JSON.parse(val)
        }
        return this._value
      }
    },
    relativeTime: {
      // 单位: 毫秒
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    underscored: true,
    timestamps: false
  })

  // 定义实际的Class
  // =============================================================================

  class Data extends ModelClass {

    // Static method
    // ===========================================================================

    static findMessagesByPeriod (start, time) {
      return this.findAll({
        where: {
          type: DM3DataType.Message,
          relativeTime: {
            [Op.gte]: start,
            [Op.lte]: start + time
          }
        }
      })
    }

    /** @desc 插入一些初始数据 */
    static async insertInitData (recordLog) {
      await this.create({ type: DM3DataType.Version, value: version })
      let recordInfo = _.pick(recordLog, ['platform', 'address', 'owner', 'title', 'quality', 'circuit'])
      recordInfo.startTime = Date.now()
      await this.create({ type: DM3DataType.RecordInfo, value: recordInfo })
    }
  }

  return Data
}
