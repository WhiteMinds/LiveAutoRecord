import type { ProviderAuthFlow } from '@autorecord/manager'

export function createPlaywrightAuthFlowExecutor() {
  return async (authFlow: ProviderAuthFlow): Promise<Record<string, string>> => {
    let pw: typeof import('playwright')
    try {
      pw = await import('playwright')
    } catch {
      throw new Error(
        'Playwright 未安装。请运行以下命令安装：\n' + '  pnpm add playwright\n' + '  npx playwright install chromium',
      )
    }

    const browser = await pw.chromium.launch({ headless: false })
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(authFlow.loginURL)

    return new Promise((resolve, reject) => {
      let settled = false
      const timeoutMs = authFlow.timeout ?? 300_000
      const timer = setTimeout(async () => {
        if (settled) return
        settled = true
        clearInterval(poller)
        await browser.close().catch(() => {})
        reject(new Error('登录超时'))
      }, timeoutMs)

      const poller = setInterval(async () => {
        if (settled) return
        try {
          const cookies = await context.cookies()
          const result = authFlow.checkLoginResult({
            url: page.url(),
            cookies: cookies.map((c) => ({
              name: c.name,
              value: c.value,
              domain: c.domain,
              path: c.path,
            })),
          })
          if (result.success && result.authConfig) {
            settled = true
            clearTimeout(timer)
            clearInterval(poller)
            await browser.close().catch(() => {})
            resolve(result.authConfig)
          }
        } catch {
          // 页面导航中，忽略
        }
      }, 1000)

      browser.on('disconnected', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        clearInterval(poller)
        reject(new Error('浏览器已关闭'))
      })
    })
  }
}
