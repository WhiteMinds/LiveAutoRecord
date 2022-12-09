import { logger } from './logger'
import { dirname, join } from 'path'
import { app, screen, shell, BrowserWindow, Menu, Tray } from 'electron'
import { startServer } from '@autorecord/http-server'
import ffmpegPathFromModule from 'ffmpeg-static'
import { getSettings, setSettings } from './settings'
import trayPNG from './assets/tray.png'
import trayICO from './assets/tray.ico'
import iconPNG from './assets/icon.png'
import iconICO from './assets/icon.ico'
import packageJSON from '../package.json'

initSingleInstanceLock()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initApp)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (
    process.platform !== 'darwin' &&
    !getSettings().notExitOnAllWindowsClosed
  ) {
    app.quit()
  }
})

function initSingleInstanceLock() {
  const lockSuccess = app.requestSingleInstanceLock()

  if (!lockSuccess) {
    app.quit()
    return
  }

  // TODO: 这个事件处理或许应该放在 initApp 中？
  app.on('second-instance', showMainWindow)
}

function initApp() {
  // windows 下的通知会展示 AppUserModelID
  app.setAppUserModelId(packageJSON.build.productName)

  startServer({
    getSettings: async () => getSettings(),
    setSettings: async (newSettings) => setSettings(newSettings),
    logger,
    // electron 在 asar 模式下对于一些文件相关的 api 有限制，而 fluent-ffmpeg 使用的 spawn
    // 则在限制范围中，所以需要解包后的路径（解包是由 electron-builder 内部 hard code 实现的）。
    // https://www.electronjs.org/fr/docs/latest/tutorial/asar-archives#executing-binaries-inside-asar-archive
    // https://github.com/electron-userland/electron-builder/blob/6f630927ca949d8bdcde06e4eafaa63ce3636d5a/packages/app-builder-lib/src/asar/unpackDetector.ts#L83
    // TODO: 更好的方案应该是在这里手动解包，可以确保路径一定正确，这里先简单实现顶着了。
    ffmpegPath: ffmpegPathFromModule.replace('.asar', '.asar.unpacked'),
  })

  app.on('browser-window-created', (e, window) => {
    // 隐藏 windows 系统下的窗口菜单栏
    window.removeMenu()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  createTray()
  createWindow()
}

function createWindow() {
  const display = screen.getPrimaryDisplay()

  const preloadPath = join(__dirname, '../preload/preload.js')
  const window = new BrowserWindow({
    icon: getIconImagePath(),
    width: Math.min(1024, display.workAreaSize.width),
    height: Math.min(768, display.workAreaSize.height),
    webPreferences: {
      // https://github.com/Yukun-Guo/vite-vue3-electron-ts-template#3-setup-electron#src/electron/preload/preload.ts
      preload: preloadPath,
    },
  })

  let baseURL: URL
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    const rendererURL = process.env['ELECTRON_RENDERER_URL']
    window.loadURL(rendererURL)
    baseURL = new URL(rendererURL)
    window.webContents.openDevTools()
  } else {
    const rendererPath = join(__dirname, '../renderer/index.html')
    window.loadFile(rendererPath)
    baseURL = new URL('file://')
    // 对于 file 协议，URL 会自动把 pathname 处理成对应系统中合适的路径，
    // 比如 windows 下的 `C:\path` 将处理为 `/C:/path`。
    // https://url.spec.whatwg.org/#dom-url-pathname
    baseURL.pathname = dirname(rendererPath)
  }

  window.webContents.setWindowOpenHandler((details) => {
    const isAppPage = details.url.startsWith(baseURL.toString())

    // 非内部的页面，转交给系统浏览器
    if (!isAppPage) {
      shell.openExternal(details.url)
      return { action: 'deny' }
    }

    // 手动创建新窗口，不然会算作 opener 的 child window，那就会在 opener 关闭时被一起关闭。
    const window = new BrowserWindow({
      icon: getIconImagePath(),
      webPreferences: {
        preload: preloadPath,
      },
    })
    window.loadURL(details.url)

    return { action: 'deny' }
  })

  window.webContents.on('render-process-gone', (event, details) => {
    logger.error('render-process-gone: ' + JSON.stringify(details))
  })
}

function createTray() {
  const tray = new Tray(getTrayImagePath())

  if (process.platform === 'win32') {
    const contextMenu = Menu.buildFromTemplate([
      { label: '显示', type: 'normal', click: showMainWindow },
      { label: '退出', type: 'normal', click: () => app.quit() },
    ])
    tray.setContextMenu(contextMenu)
  }

  tray.on('click', showMainWindow)

  return tray
}

function showMainWindow() {
  const mainWindows = BrowserWindow.getAllWindows().filter(isMainWindow)
  if (mainWindows.length === 0) {
    createWindow()
  } else {
    const window = mainWindows[0]
    // 似乎新版本的 electron 在 show 时会自动 restore，不过这里保险起见先冗余着了。
    if (window.isMinimized()) window.restore()
    window.show()
  }
}

function isMainWindow(window: BrowserWindow) {
  const url = window.webContents.getURL()
  // 这里就简单点实现，hard code 下
  const isPlayerPage = url.match(/\/player\?id=[^&]*$/) != null
  return !isPlayerPage
}

function getTrayImagePath() {
  switch (process.platform) {
    case 'win32':
      return join(__dirname, trayICO)
    case 'darwin':
    case 'linux':
    default:
      return join(__dirname, trayPNG)
  }
}

function getIconImagePath() {
  switch (process.platform) {
    case 'win32':
      return join(__dirname, iconICO)
    case 'darwin':
    case 'linux':
    default:
      return join(__dirname, iconPNG)
  }
}
