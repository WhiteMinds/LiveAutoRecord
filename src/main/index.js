'use strict'

import { app, BrowserWindow, Tray, Menu } from 'electron'

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

function createWindow () {
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 563,
    useContentSize: true,
    webPreferences: {
      backgroundThrottling: false
    }
  })
  // 移除菜单栏
  mainWindow.setMenu(null)

  // 设置托盘菜单
  createTray(mainWindow)

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray (mainWindow) {
  let tray = new Tray(`${__static}/tray.png`)
  let menu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏 窗口',
      click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    },
    {
      label: '退出',
      click: () => app.quit()
    }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('LAR 直播自动录制')
  tray.on('click', () => mainWindow.show())
  mainWindow.appTray = tray
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
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
