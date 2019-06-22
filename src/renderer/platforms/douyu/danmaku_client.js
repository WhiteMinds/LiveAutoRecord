/* eslint-disable camelcase */
import EventEmitter from 'events'
import DouYuClient from 'douyu-danmu'
import log from '@/modules/log'
import { sleep } from '@/helper'
import ColorMap from './color_map'
import GiftMap from './gift_map'

// Hook douyu-danmu, 使其返回更多的数据
// =============================================================================

let _build_chat_origin = DouYuClient.prototype._build_chat
DouYuClient.prototype._build_chat = function (...args) {
  let msg = args[0]
  let result = _build_chat_origin.apply(this, args)
  result.colorId = msg.col
  result.avatar = msg.ic.replace(/@S/g, '/')
  return result
}

let _build_gift_origin = DouYuClient.prototype._build_gift
DouYuClient.prototype._build_gift = function (...args) {
  let msg = args[0]
  let gift = GiftMap[msg.gfid]
  let result = _build_gift_origin.apply(this, args)
  result.gfid = msg.gfid
  result.avatar = msg.ic.replace(/@S/g, '/')
  if (!result.price) result.price = 0
  if (gift) Object.assign(result, gift)
  return result
}

// Export class
// =============================================================================

export default class Client extends EventEmitter {
  constructor (address) {
    super()
    this.address = address
    this.userComboMap = {}
  }

  start () {
    if (this.client) return

    this.client = new DouYuClient(this.address)
    this.client.on('error', err => log.error('DouYuClient error', err))
    this.client.on('close', async () => {
      log.warn('DouYuClient close, automatic reconnection in a short time')
      await sleep(1e3)
      this.stop()
      this.start()
    })
    this.client.on('message', this._messageHandler.bind(this))
    this.client.start()
    this._giftComboCheckLoop()
  }

  stop () {
    this.client.stop()
    this.client = null
    clearTimeout(this._gcclTimer)
  }

  _messageHandler (msg) {
    let _msg = {
      type: msg.type,
      sender: msg.from.name,
      avatar: msg.avatar
    }

    switch (msg.type) {
      case 'chat':
        _msg.text = msg.content
        _msg.color = ColorMap[msg.colorId] || '#fff'
        break
      case 'gift':
      case 'yuwan':
      case 'deserve':
        return this._giftComboHandler(msg)
      default:
        return
    }

    this.emit('message', _msg)
  }

  // 价值>1元的礼物会立即emit, 并计入连击, <=1元的礼物则会在每累积100次连击或连击中断时emit
  // 价值>1元的礼物连击时间为2分钟, <=1元的为2秒

  _giftComboHandler (msg) {
    const now = Date.now()
    msg.cheaper = msg.price <= 1

    if (!this.userComboMap[msg.sender]) this.userComboMap[msg.sender] = {}
    let giftComboMap = this.userComboMap[msg.sender]
    if (!giftComboMap[msg.gfid]) giftComboMap[msg.gfid] = { lastGive: now, lastEmitCombo: 0, combo: 0, msg }
    let comboInfo = giftComboMap[msg.gfid]

    comboInfo.lastGive = now
    comboInfo.combo++

    if (msg.cheaper) {
      const stageTarget = 100
      if (Math.floor(comboInfo.combo / stageTarget) <= Math.floor(comboInfo.lastEmitCombo / stageTarget)) {
        return
      }
    }

    this._emitGiftMsg(msg, comboInfo)
  }

  _giftComboCheckLoop () {
    const now = Date.now()
    for (let userName in this.userComboMap) {
      let giftComboMap = this.userComboMap[userName]

      for (let gfid in giftComboMap) {
        let comboInfo = giftComboMap[gfid]
        let msg = comboInfo.msg
        let stayTime = msg.cheaper ? 2e3 : 120e3

        if (now > comboInfo.lastGive + stayTime) {
          // 连击中断
          if (msg.cheaper) this._emitGiftMsg(msg, comboInfo)
          delete giftComboMap[gfid]
        }
      }

      if (Object.keys(giftComboMap).length === 0) delete this.userComboMap[userName]
    }

    this._gcclTimer = setTimeout(this._giftComboCheckLoop.bind(this), 1e3)
  }

  _emitGiftMsg (msg, comboInfo) {
    if (msg.cheaper) msg.count = comboInfo.combo - comboInfo.lastEmitCombo
    comboInfo.lastEmitCombo = comboInfo.combo
    this.emit('message', {
      type: 'gift',
      sender: msg.from.name,
      avatar: msg.avatar,
      gfid: msg.gfid,
      count: msg.count,
      combo: comboInfo.combo
    })
  }
}
