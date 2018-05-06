const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

app.on('ready', createWindow)

function createWindow () {
    let win = new BrowserWindow({
        width: 1000,
        height: 800,
        title: '直播自动录制',
        icon: path.join(__dirname, 'logo.png'),
        show: false
    })
    // 等待页面加载完后再显示窗口
    win.once('ready-to-show', () => win.show())
    // 移除菜单栏
    win.setMenu(null)

    // 设置托盘菜单
    let tray = new Tray(path.join(__dirname, 'logo.png'))
    let menu = Menu.buildFromTemplate([
        {
            label: "显示/隐藏 窗口",
            click: () => win.isVisible() ? win.hide() : win.show()
        },
        {
            label: "退出",
            click: () => app.quit()
        }
    ]);
    tray.setContextMenu(menu)
    tray.setToolTip("直播自动录制")
    tray.on("click", () => win.show())
    win.appTray = tray

    // 加载页面
    win.loadURL(url.format({
        pathname: path.join(__dirname, isStreamLinkInstanlled () ? 'index.html' : 'environment.html'),
        protocol: 'file:',
        slashes: true
    }))

    // 开发工具
    win.webContents.openDevTools ()
}

function isStreamLinkInstanlled () { // TODO 可以考虑改为根据系统改变判断方式
    let paths = process.env.Path.split(';')
    for (let i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i]) && fs.statSync(paths[i]).isDirectory()) {
            if (fs.readdirSync(paths[i]).filter(fileName => fileName.includes('streamlink.exe')).length > 0) {
                return true
            }
        }
    }
    return false
}
