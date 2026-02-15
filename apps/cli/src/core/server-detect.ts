import http from 'http'

/**
 * 检测本地 http-server 是否正在运行。
 * 尝试连接 localhost:8085/api/manager，超时 1s。
 */
export function isServerRunning(port = 8085): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/manager`, (res) => {
      res.resume()
      resolve(true)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.setTimeout(1000, () => {
      req.destroy()
      resolve(false)
    })
  })
}
