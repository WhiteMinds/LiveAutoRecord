import { Command } from 'commander'
import { initManager, recorderManager, saveProviderAuthConfig } from '../core/manager-init'
import { isJsonMode, logger, outputJson, outputSuccess, outputError, outputTable } from '../core/output'

export function createAuthCommand(): Command {
  const cmd = new Command('auth').description('Manage provider authentication (cookie login)').addHelpText(
    'after',
    `
Examples:
  $ lar auth list                                      # list all providers auth status
  $ lar auth set Bilibili --cookie "SESSDATA=xxx"      # set cookie for Bilibili
  $ lar auth login Bilibili                            # browser login for Bilibili
  $ lar auth clear Bilibili                            # clear auth for Bilibili
  $ lar auth list --json                               # JSON output`,
  )

  cmd
    .command('list')
    .description('List authentication status for all providers')
    .action(async () => {
      await initManager()

      const results = await Promise.all(
        recorderManager.providers.map(async (p) => {
          const hasAuth = !!p.authFields && p.authFields.length > 0
          let status = { isAuthenticated: false, description: undefined as string | undefined }
          if (hasAuth && p.checkAuth) {
            try {
              status = await p.checkAuth()
            } catch {
              status = { isAuthenticated: false, description: 'check failed' }
            }
          }
          return {
            id: p.id,
            name: p.name,
            hasAuth,
            isAuthenticated: status.isAuthenticated,
            description: status.description ?? '',
          }
        }),
      )

      if (isJsonMode()) {
        outputJson({ success: true, data: results })
      } else {
        outputTable(
          [
            { name: 'id', title: 'Provider' },
            { name: 'hasAuth', title: 'Auth Support' },
            { name: 'isAuthenticated', title: 'Authenticated' },
            { name: 'description', title: 'Info' },
          ],
          results,
        )
      }
    })

  cmd
    .command('set <provider>')
    .description('Set authentication config for a provider')
    .option('--cookie <cookie>', 'Cookie string')
    .action(async (providerId: string, opts: { cookie?: string }) => {
      await initManager()

      const provider = recorderManager.providers.find((p) => p.id === providerId)
      if (!provider) {
        outputError(
          `Provider "${providerId}" not found. Available: ${recorderManager.providers.map((p) => p.id).join(', ')}`,
        )
        process.exitCode = 1
        return
      }

      if (!provider.setAuth) {
        outputError(`Provider "${providerId}" does not support authentication`)
        process.exitCode = 1
        return
      }

      const config: Record<string, string> = {}
      if (opts.cookie) config.cookie = opts.cookie

      if (Object.keys(config).length === 0) {
        outputError('No auth config provided. Use --cookie <value>')
        process.exitCode = 1
        return
      }

      provider.setAuth(config)
      saveProviderAuthConfig(providerId, config)

      if (provider.checkAuth) {
        const status = await provider.checkAuth()
        outputSuccess(
          status,
          status.isAuthenticated ? `Authenticated as: ${status.description}` : 'Auth set but verification failed',
        )
      } else {
        outputSuccess({ set: true }, 'Auth config saved')
      }
    })

  cmd
    .command('login <provider>')
    .description('Login via browser (requires Playwright)')
    .action(async (providerId: string) => {
      await initManager()

      const provider = recorderManager.providers.find((p) => p.id === providerId)
      if (!provider) {
        outputError(
          `Provider "${providerId}" not found. Available: ${recorderManager.providers.map((p) => p.id).join(', ')}`,
        )
        process.exitCode = 1
        return
      }

      if (!provider.authFlow) {
        outputError(`Provider "${providerId}" does not support browser login`)
        process.exitCode = 1
        return
      }

      logger.info('Opening browser for login...')

      try {
        const { executeAuthFlow } = await import('../core/auth-flow')
        const authConfig = await executeAuthFlow(provider.authFlow)

        if (provider.setAuth) {
          provider.setAuth(authConfig)
        }
        saveProviderAuthConfig(providerId, authConfig)

        if (provider.checkAuth) {
          // 等待一小段时间让平台 API 识别新会话
          await new Promise((r) => setTimeout(r, 1500))
          const status = await provider.checkAuth()
          outputSuccess(
            status,
            status.isAuthenticated
              ? `Login successful: ${status.description}`
              : 'Login completed but verification failed',
          )
        } else {
          outputSuccess({ login: true }, 'Login successful')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        outputError(`Login failed: ${msg}`)
        process.exitCode = 1
      }
    })

  cmd
    .command('clear <provider>')
    .description('Clear authentication config for a provider')
    .action(async (providerId: string) => {
      await initManager()

      const provider = recorderManager.providers.find((p) => p.id === providerId)
      if (!provider) {
        outputError(
          `Provider "${providerId}" not found. Available: ${recorderManager.providers.map((p) => p.id).join(', ')}`,
        )
        process.exitCode = 1
        return
      }

      if (provider.setAuth) {
        provider.setAuth({})
      }
      saveProviderAuthConfig(providerId, null)

      outputSuccess(null, `Auth cleared for ${providerId}`)
    })

  return cmd
}
