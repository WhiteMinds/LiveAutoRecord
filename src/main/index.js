'use strict'

import fs from 'fs'
import path from 'path'
import { app, BrowserWindow, Tray, Menu } from 'electron'
const { version, build } = require('../../package.json')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${process.env.DEV_PORT || 9080}`
  : `file://${__dirname}/index.html`

function init () {
  try {
    // 不设置id的话, 会导致通知无法使用
    app.setAppUserModelId(build.appId)
    // 创建主窗口
    createMainWindow()
  } catch (err) {
    // 记录错误后再抛出
    console.error(err)
    fs.writeFileSync('launch.log', err.stack)
    throw err
  }
}

function createMainWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.join(__static, 'icon.ico'),
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false
    },
    show: false
  })

  mainWindow.setMenu(null)

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle(`LAR 直播自动录制 [v${version}]`)
    mainWindow.show()
    mainWindow.focus()
  })

  createTray(mainWindow)
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
  // todo ToolTip考虑增加录制状态, 如"正在录制: 0"
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
