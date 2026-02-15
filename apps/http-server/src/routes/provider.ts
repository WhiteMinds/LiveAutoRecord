import { Router } from 'express'
import { recorderManager, saveProviderAuthConfig } from '../manager'
import { ServerOpts } from '../types'
import { asyncRouteHandler } from './utils'

export function createRouter(serverOpts: ServerOpts) {
  const router = Router()

  // GET /providers - 返回 providers 列表及其 authFields/authFlow 信息
  router.get(
    '/providers',
    asyncRouteHandler(async (req, res) => {
      const providers = recorderManager.providers.map((p) => ({
        id: p.id,
        name: p.name,
        siteURL: p.siteURL,
        authFields: p.authFields,
        hasAuthFlow: !!p.authFlow,
      }))
      res.json({ payload: providers })
    }),
  )

  // GET /providers/:id/auth - 调用 provider.checkAuth() 返回鉴权状态
  router.get(
    '/providers/:id/auth',
    asyncRouteHandler(async (req, res) => {
      const provider = recorderManager.providers.find((p) => p.id === req.params.id)
      if (!provider) {
        res.status(404).json({ error: 'Provider not found' })
        return
      }

      if (!provider.checkAuth) {
        res.json({ payload: { isAuthenticated: false } })
        return
      }

      const status = await provider.checkAuth()
      res.json({ payload: status })
    }),
  )

  // PUT /providers/:id/auth - 手动设置鉴权配置
  router.put(
    '/providers/:id/auth',
    asyncRouteHandler(async (req, res) => {
      const provider = recorderManager.providers.find((p) => p.id === req.params.id)
      if (!provider) {
        res.status(404).json({ error: 'Provider not found' })
        return
      }

      if (!provider.setAuth) {
        res.status(400).json({ error: 'Provider does not support auth' })
        return
      }

      const config = req.body.config as Record<string, string>
      provider.setAuth(config)
      saveProviderAuthConfig(provider.id, config)

      const status = provider.checkAuth ? await provider.checkAuth() : { isAuthenticated: false }
      res.json({ payload: status })
    }),
  )

  // POST /providers/:id/auth/login - 触发浏览器登录流程
  router.post(
    '/providers/:id/auth/login',
    asyncRouteHandler(async (req, res) => {
      const provider = recorderManager.providers.find((p) => p.id === req.params.id)
      if (!provider) {
        res.status(404).json({ error: 'Provider not found' })
        return
      }

      if (!provider.authFlow) {
        res.status(400).json({ error: 'Provider does not support auth flow' })
        return
      }

      if (!serverOpts.executeAuthFlow) {
        res.status(501).json({ error: 'Browser login not available in this environment' })
        return
      }

      try {
        const authConfig = await serverOpts.executeAuthFlow(provider.authFlow)

        if (provider.setAuth) {
          provider.setAuth(authConfig)
        }
        saveProviderAuthConfig(provider.id, authConfig)

        // 等待一小段时间让平台 API 识别新会话
        await new Promise((r) => setTimeout(r, 1500))
        const status = provider.checkAuth ? await provider.checkAuth() : { isAuthenticated: true }
        res.json({ payload: { authConfig, status } })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        res.status(400).json({ error: message })
      }
    }),
  )

  // DELETE /providers/:id/auth - 清除鉴权配置
  router.delete(
    '/providers/:id/auth',
    asyncRouteHandler(async (req, res) => {
      const provider = recorderManager.providers.find((p) => p.id === req.params.id)
      if (!provider) {
        res.status(404).json({ error: 'Provider not found' })
        return
      }

      if (provider.setAuth) {
        provider.setAuth({})
      }
      saveProviderAuthConfig(provider.id, null)

      res.json({ payload: null })
    }),
  )

  return router
}
