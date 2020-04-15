import path from 'path'
import ipc from 'electron-better-ipc'
import { BrowserWindow } from 'electron'
import _ from 'lodash'
import config from './config'
import store from './store'
import { IPCMsg, WinURL } from 'const'

ipc.answerRenderer(IPCMsg.GetConfig, () => {
  return config.data
})

ipc.answerRenderer(IPCMsg.SetConfig, (data, sender) => {
  config.data = data
  config.save()

  // 通知除了sender之外的其他窗口
  BrowserWindow.getAllWindows()
    .filter(win => win.id !== sender.id)
    .forEach(win => {
      ipc.callRenderer(win, IPCMsg.SetConfig, config.data)
    })
})

ipc.answerRenderer(IPCMsg.SetRecordingChannel, ({ recording, channel }) => {
  let existChannel = store.recordingChannels.find(c => c.id === channel.id)
  if (recording && !existChannel) store.recordingChannels.push(channel)
  if (!recording && existChannel) _.remove(store.recordingChannels, existChannel)

  let tipText = `正在录制: ${store.recordingChannels.length}个`
  if (store.recordingChannels.length > 0) {
    tipText += '\n' + store.recordingChannels.map(c => c.profile).join('\n')
  }
  store.mainWindow.appTray.setToolTip(tipText)
})

ipc.answerRenderer(IPCMsg.CreatePlayer, (file) => {
  let win = createWindow(WinURL + '#/player', 'LAR 弹幕播放器', {
    webPreferences: {
      additionalArguments: ['--record-file', file]
    }
  })

  return new Promise(resolve => win.on('ready-to-show', resolve))
})

// Utils
// =============================================================================

function createWindow (url, title, options) {
  options = _.merge({
    icon: path.join(__static, 'icon.ico'),
    width: 1600,
    height: 750,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      backgroundThrottling: false
    },
    show: false
  }, options)

  let win = new BrowserWindow(options)
  win.setMenu(null)
  win.loadURL(url).then(() => {
    win.setTitle(title)
    win.show()
    win.focus()
  })

  return win
}
