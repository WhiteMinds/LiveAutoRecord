'use strict'

import { app, BrowserWindow, Tray, Menu } from 'electron'
import lar from './lar'
import ipc from './ipc'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`

async function init () {
  try {
    // LAR
    await lar.init()
    // 创建窗口
    mainWindow = createWindow()
    // IPC
    ipc.init(mainWindow.webContents)
  } catch (err) {
    console.error(err)
    app.quit()
  }
}

function createWindow () {
  let win = new BrowserWindow({
    width: 1000,
    height: 563,
    useContentSize: true,
    webPreferences: {
      backgroundThrottling: false
    },
    show: false
  })
  // 移除菜单栏
  win.setMenu(null)

  // 设置托盘菜单
  createTray(win)

  win.loadURL(winURL)

  win.on('closed', () => {
    win = null
  })

  win.on('ready-to-show', () => {
    win.show()
    win.focus()
  })

  return win
}

function createTray (win) {
  let tray = new Tray(`${__static}/tray.png`)
  let menu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏 窗口',
      click: () => win.isVisible() ? win.hide() : win.show()
    },
    {
      label: '退出',
      click: () => app.quit()
    }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('LAR 直播自动录制')
  tray.on('click', () => win.show())
  win.appTray = tray
}

app.on('ready', init)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    init()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
