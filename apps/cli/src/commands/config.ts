import { Command } from 'commander'
import { managerConfigPath, defaultManagerConfig, managerConfigKeys, type ManagerConfig } from '../core/manager-init'
import { readJSONFileSync, writeJSONFileSync } from '@autorecord/core'
import { isJsonMode, logger, outputJson, outputSuccess, outputError, outputTable } from '../core/output'

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('View or modify manager configuration')
    .argument('[key]', 'Config key to view or set')
    .argument('[value]', 'New value to set')
    .option('--reset', 'Reset configuration to defaults')
    .addHelpText(
      'after',
      `
Examples:
  $ lar config                          # show all config
  $ lar config savePath                 # show a single key
  $ lar config autoCheckInterval 30000  # set check interval to 30s
  $ lar config --reset                  # reset all to defaults
  $ lar config --json                   # JSON output

Available keys: ${managerConfigKeys.join(', ')}`,
    )
    .action(async (key?: string, value?: string, opts?: { reset?: boolean }) => {
      const config = readJSONFileSync<ManagerConfig>(managerConfigPath, defaultManagerConfig)

      if (opts?.reset) {
        writeJSONFileSync(managerConfigPath, defaultManagerConfig)
        outputSuccess(defaultManagerConfig, 'Configuration reset to defaults')
        return
      }

      if (key == null) {
        // 列出所有配置
        if (isJsonMode()) {
          outputJson({ success: true, data: config })
        } else {
          outputTable(
            [
              { name: 'key', title: 'Key' },
              { name: 'value', title: 'Value' },
            ],
            managerConfigKeys.map((k) => ({
              key: k,
              value: String(config[k]),
            })),
          )
        }
        return
      }

      if (!managerConfigKeys.includes(key as keyof ManagerConfig)) {
        outputError(`Unknown config key "${key}". Valid keys: ${managerConfigKeys.join(', ')}`)
        process.exitCode = 1
        return
      }

      const configKey = key as keyof ManagerConfig

      if (value == null) {
        // 读取单项
        if (isJsonMode()) {
          outputJson({ success: true, data: { key: configKey, value: config[configKey] } })
        } else {
          logger.info(`${configKey} = ${config[configKey]}`)
        }
        return
      }

      // 写入
      const currentValue = config[configKey]
      let parsedValue: string | number | boolean

      if (typeof currentValue === 'boolean') {
        if (value !== 'true' && value !== 'false') {
          outputError(`Value for "${configKey}" must be "true" or "false"`)
          process.exitCode = 1
          return
        }
        parsedValue = value === 'true'
      } else if (typeof currentValue === 'number') {
        parsedValue = Number(value)
        if (isNaN(parsedValue)) {
          outputError(`Value for "${configKey}" must be a number`)
          process.exitCode = 1
          return
        }
      } else {
        parsedValue = value
      }

      ;(config as any)[configKey] = parsedValue
      writeJSONFileSync(managerConfigPath, config)

      outputSuccess({ key: configKey, value: parsedValue }, `Config updated: ${configKey} = ${parsedValue}`)
    })

  return cmd
}
