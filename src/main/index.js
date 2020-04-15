'use strict'

import fs from 'fs'
import path from 'path'
import ipc from 'electron-better-ipc'
import { app, BrowserWindow, Tray, Menu } from 'electron'
import config from './config'
import store from './store'
import './ipc'
import { IPCMsg, Dev, WinURL, EmptyFn } from 'const'
const { version, build } = require('../../package.json')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (!Dev) {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// 全局错误捕捉
const errorHandler = (err) => {
  console.error('uncaught', err)
  fs.writeFileSync(`uncaught-${Date.now()}.log`, err.stack)
}
process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

let mainWindow
let tray

function init () {
  // 不设置id的话, 会导致通知无法使用
  app.setAppUserModelId(build.appId)

  config.load()

  // 创建托盘和主窗口
  createTray()
  createMainWindow()
}

function createMainWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.join(__static, 'icon.ico'),
    width: 1280,
    height: 800,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      backgroundThrottling: false
    },
    show: false
  })
  mainWindow.appTray = tray

  mainWindow.setMenu(null)

  mainWindow.loadURL(WinURL).then(() => {
    mainWindow.setTitle(`LAR 直播自动录制 [v${version}]`)
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('minimize', () => {
    if (config.data.app.minimizeToTaskBar) {
      mainWindow.hide()
    }
  })

  mainWindow.on('close', (event) => {
    if (store.recordingChannels.length > 0) {
      // 有录制中的视频, 将关闭过程转交给主窗口
      event.preventDefault()
      ipc.callRenderer(mainWindow, IPCMsg.OpenCloseTip)
    } else {
      // 主窗口关闭直接强制退出, 后面要兼容mac的话应该还要再修改
      app.quit()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  store.mainWindow = mainWindow
}

function createTray () {
  tray = new Tray(`${__static}/tray.png`)
  let menu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏 窗口',
      click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    },
    {
      label: '退出',
      click: () => {
        if (store.recordingChannels.length > 0) {
          if (!mainWindow.isVisible()) mainWindow.show()
          mainWindow.focus()
          ipc.callRenderer(mainWindow, IPCMsg.OpenCloseTip)
        } else {
          app.quit()
        }
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('LAR 直播自动录制')
  tray.on('click', () => mainWindow.show())
}

app.on('ready', init)

// 必须监听, 不然在restartMainWindow时会直接退出程序
app.on('window-all-closed', EmptyFn)

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow()
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
