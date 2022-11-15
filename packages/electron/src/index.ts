import { join } from 'path'
import { app, BrowserWindow, Menu, Tray } from 'electron'
import { startServer } from '@autorecord/http-server'
import { getSettings, setSettings } from './settings'
import trayPNG from './assets/tray.png'
import trayICO from './assets/tray.ico'

startServer({
  getSettings: async () => getSettings(),
  setSettings: async (newSettings) => setSettings(newSettings),
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
  createTray()

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
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' },
  ])
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)

  return tray
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
