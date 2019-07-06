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

export function zerofill (n, len = 2) {
  return _.padStart(n, len, '0')
}

export function illegalCharRemove (str) {
  if (typeof str !== 'string') return str
  switch (process.platform) {
    case 'win32':
      str = str.replace(/[<>:"|?*./\\]/g, '')
      break
    case 'linux':
      str = str.replace(/\./g, '')
      break
    case 'darwin':
      str = str.replace(/:/g, '')
      break
  }
  return str
}
