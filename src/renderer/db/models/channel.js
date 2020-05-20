import path from 'path'
import fs from 'fs-extra'
import _ from 'lodash'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import format from 'string-template'
import config from '@/modules/config'
import platforms from '@/platforms'
import { zerofill, illegalCharRemove } from '@/helper'
import { Platform, ChannelStatus, ChannelStatusPriority, IPCMsg } from 'const'

export default (sequelize, DataTypes) => {

  // 定义数据模型
  // =============================================================================

  const ModelClass = sequelize.define('Channel', {
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
    quality: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    circuit: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    barrage: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    autoProcess: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

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
    },
    // 该属性在Recording状态一段时间后赋值
    record: DataTypes.VIRTUAL
  }, {
    underscored: true
  })

  // 定义实际的Class
  // =============================================================================

  class Channel extends ModelClass {

    constructor (...args) {
      super(...args)
      // 虚拟字段不支持defaultValue, 要在此处初始化
      this.status = 0
      this.record = null
    }

    // Static method
    // ===========================================================================

    static findBy (data) {
      return this.findOne({ where: data })
    }

    // Attributes handle
    // ===========================================================================

    get platformObj () {
      return platforms[this.platform]
    }

    get qualities () {
      return this.platformObj.qualities
    }

    get circuits () {
      return this.platformObj.circuits
    }

    get url () {
      return this.platformObj.getUrl(this.address)
    }

    get profile () {
      let v = `${this.platformCN}-${this.address}`
      if (this.alias.trim()) v += ` (${this.alias})`
      return v
    }

    get isCorrectQuality () {
      if (!this.record) return false
      return this.record.streamInfo.quality === this.quality
    }

    setStatus (idx, status) {
      let bit = 1 << (idx - 1)
      if (status) {
        this.status = this.status | bit
      } else {
        this.status = this.status & ~bit
      }

      if (idx === ChannelStatus.Recording) {
        ipc.callMain(IPCMsg.SetRecordingChannel, {
          recording: status,
          channel: _.pick(this, ['id', 'profile'])
        })
      }
    }

    getStatus (idx) {
      let bit = 1 << (idx - 1)
      return (this.status & bit) > 0
    }

    // Actions
    // ===========================================================================

    getInfo () {
      return this.platformObj.getInfo(this.address)
    }

    getStream () {
      return this.platformObj.getStream(this.address, this.quality, this.circuit)
    }

    genSavePath (...extDataList) {
      let now = new Date()
      let data = {
        platform: this.platformCN,
        address: this.address,
        alias: illegalCharRemove(this.alias),
        year: now.getFullYear(),
        month: zerofill(now.getMonth() + 1),
        date: zerofill(now.getDate()),
        hour: zerofill(now.getHours()),
        min: zerofill(now.getMinutes()),
        sec: zerofill(now.getSeconds())
      }
      extDataList.forEach(extData => Object.assign(data, extData))
      data.owner = illegalCharRemove(data.owner)
      data.title = illegalCharRemove(data.title)

      let saveFolder = format(config.record.saveFolder, data)
      let saveName = format(config.record.saveName, data)
      let savePath = path.join(saveFolder, saveName)
      fs.ensureDirSync(saveFolder)

      return {
        record: `${savePath}.${config.record.saveFormat}`,
        danmaku: `${savePath}.dm3`
      }
    }

    stopRecord () {
      if (this.record) {
        this.record.stopRecord()
        this.record.stopDanmaku()
        delete this.record
      }
      this.setStatus(ChannelStatus.Recording, false)

      if (this.getStatus(ChannelStatus.NotCheck)) return
      // 持续一段时间不检测, 防止终止完后立即又开始录制了
      this.setStatus(ChannelStatus.NotCheck, true)
      setTimeout(() => this.setStatus(ChannelStatus.NotCheck, false), 5e3)
    }
  }

  return Channel
}
