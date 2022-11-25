import { join } from 'path'
import { app, BrowserWindow, Menu, Tray } from 'electron'
import { startServer } from '@autorecord/http-server'
import ffmpegPathFromModule from 'ffmpeg-static'
import { getSettings, setSettings } from './settings'
import trayPNG from './assets/tray.png'
import trayICO from './assets/tray.ico'

startServer({
  getSettings: async () => getSettings(),
  setSettings: async (newSettings) => setSettings(newSettings),
  // electron 在 asar 模式下对于一些文件相关的 api 有限制，而 fluent-ffmpeg 使用的 spawn
  // 则在限制范围中，所以需要解包后的路径（解包是由 electron-builder 内部 hard code 实现的）。
  // https://www.electronjs.org/fr/docs/latest/tutorial/asar-archives#executing-binaries-inside-asar-archive
  // https://github.com/electron-userland/electron-builder/blob/6f630927ca949d8bdcde06e4eafaa63ce3636d5a/packages/app-builder-lib/src/asar/unpackDetector.ts#L83
  // TODO: 更好的方案应该是在这里手动解包，可以确保路径一定正确，这里先简单实现顶着了。
  ffmpegPath: ffmpegPathFromModule.replace('.asar', '.asar.unpacked'),
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // https://github.com/Yukun-Guo/vite-vue3-electron-ts-template#3-setup-electron#src/electron/preload/preload.ts
      preload: join(__dirname, '../preload/preload.js'),
    },
  })
  mainWindow.setMenu(null)

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']!)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createTray()
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

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

function createTray() {
  const tray = new Tray(getTrayImagePath())

  if (process.platform === 'win32') {
    const contextMenu = Menu.buildFromTemplate([
      { label: '显示', type: 'normal', click: showWindow },
      { label: '退出', type: 'normal', click: () => app.quit() },
    ])
    tray.setContextMenu(contextMenu)
  }

  tray.on('click', showWindow)

  return tray
}

function showWindow() {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length === 0) {
    createWindow()
  } else {
    windows[0].show()
  }
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
