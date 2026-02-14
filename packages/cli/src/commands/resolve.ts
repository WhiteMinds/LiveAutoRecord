import { Command } from 'commander'
import { recorderManager } from '../core/manager-init'
import { isJsonMode, outputJson, outputError, outputTable } from '../core/output'

const SUPPORTED_PLATFORMS = `
Supported platforms:
  Bilibili  https://live.bilibili.com/<room_id>
  DouYu     https://www.douyu.com/<room_id>
  HuYa      https://www.huya.com/<room_id>
  DouYin    https://live.douyin.com/<room_id>`

export function createResolveCommand(): Command {
  return new Command('resolve')
    .description('Resolve a live stream URL to platform/channel info')
    .argument('<url>', 'Live stream URL to resolve')
    .addHelpText('after', `
Examples:
  $ lar resolve https://live.bilibili.com/12345
  $ lar resolve https://www.douyu.com/288016 --json
  $ lar resolve https://www.huya.com/667812
  $ lar resolve https://live.douyin.com/123456789
${SUPPORTED_PLATFORMS}`)
    .action(async (url: string) => {
      for (const provider of recorderManager.providers) {
        if (!provider.matchURL(url)) continue

        try {
          const info = await provider.resolveChannelInfoFromURL(url)
          if (!info) continue

          const result = {
            providerId: provider.id,
            providerName: provider.name,
            channelId: info.id,
            title: info.title,
            owner: info.owner,
          }

          if (isJsonMode()) {
            outputJson({ success: true, data: result })
          } else {
            outputTable(
              [
                { name: 'field', title: 'Field' },
                { name: 'value', title: 'Value' },
              ],
              [
                { field: 'Platform', value: `${result.providerName} (${result.providerId})` },
                { field: 'Channel ID', value: result.channelId },
                { field: 'Title', value: result.title },
                { field: 'Owner', value: result.owner },
              ],
            )
          }
          return
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
            outputError(`Network error while resolving URL. Please check your internet connection.\n  Detail: ${msg}`)
          } else {
            outputError(`Failed to resolve URL with provider ${provider.id}: ${msg}`)
          }
          process.exitCode = 1
          return
        }
      }

      outputError(`No provider matched the given URL: ${url}\n${SUPPORTED_PLATFORMS}`)
      process.exitCode = 1
    })
}
