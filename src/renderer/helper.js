import path from 'path'
import _ from 'lodash'
import iView from 'iview'
import log from '@/modules/log'

export function sleep (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function noticeError (err, tip = '发生了错误', duration = 10) {
  log.error(err)
  tip = `${_.escape(tip)}: ${err.message}`
  iView.Message.error({
    content: tip,
    duration,
    closable: true
  })
}

export function createNotice (title, body) {
  return new Notification(title, {
    icon: path.join(__static, 'icon.ico'),
    body
  })
}
