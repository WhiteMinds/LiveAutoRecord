const fs = require('fs')

export function isStreamLinkInstalled () { // TODO 可以考虑改为根据系统改变判断方式
  let paths = process.env.Path.split(';')
  for (let i = 0; i < paths.length; i++) {
    if (fs.existsSync(paths[i]) && fs.statSync(paths[i]).isDirectory()) {
      if (fs.readdirSync(paths[i]).filter(fileName => fileName.indexOf('streamlink.exe') !== -1).length > 0) {
        return true
      }
    }
  }
  return false
}
