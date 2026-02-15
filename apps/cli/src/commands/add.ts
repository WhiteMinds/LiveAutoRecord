import { Command } from 'commander'
import { Qualities } from '@autorecord/manager'
import { initManager, recorderManager, addRecorderWithAutoIncrementId, saveDB } from '../core/manager-init'
import { outputError, outputSuccess } from '../core/output'

export function createAddCommand(): Command {
  return new Command('add')
    .description('Add a recorder for a live stream URL')
    .argument('<url>', 'Live stream URL to record')
    .option('-r, --remarks <remarks>', 'Remarks for the recorder')
    .option('--no-auto-check', 'Disable automatic live status checking')
    .option(`-q, --quality <quality>`, `Stream quality (${Qualities.join(', ')})`, 'highest')
    .addHelpText(
      'after',
      `
Examples:
  $ lar add https://live.bilibili.com/12345
  $ lar add https://www.douyu.com/288016 -r "My streamer" -q high
  $ lar add https://www.huya.com/667812 --no-auto-check --json`,
    )
    .action(async (url: string, opts: { remarks?: string; autoCheck: boolean; quality: string }) => {
      if (!Qualities.includes(opts.quality as any)) {
        outputError(`Invalid quality "${opts.quality}". Valid values: ${Qualities.join(', ')}`)
        process.exitCode = 1
        return
      }

      let providerId: string | null = null
      let channelId: string | null = null

      for (const provider of recorderManager.providers) {
        if (!provider.matchURL(url)) continue

        try {
          const info = await provider.resolveChannelInfoFromURL(url)
          if (!info) continue

          providerId = provider.id
          channelId = info.id

          if (!opts.remarks) {
            opts.remarks = info.owner
          }
          break
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
            outputError(`Network error while resolving URL. Please check your internet connection.\n  Detail: ${msg}`)
          } else {
            outputError(`Failed to resolve channel info: ${msg}`)
          }
          process.exitCode = 1
          return
        }
      }

      if (!providerId || !channelId) {
        outputError(
          `No provider matched the given URL: ${url}\n` +
            'Supported: Bilibili, DouYu, HuYa, DouYin. Run "lar resolve --help" for URL formats.',
        )
        process.exitCode = 1
        return
      }

      await initManager()

      const existing = recorderManager.recorders.find((r) => r.providerId === providerId && r.channelId === channelId)
      if (existing) {
        outputError(
          `Recorder already exists for this channel (id: ${existing.id}, remarks: "${existing.remarks ?? ''}")`,
        )
        process.exitCode = 1
        return
      }

      const recorder = addRecorderWithAutoIncrementId({
        providerId,
        channelId,
        remarks: opts.remarks,
        disableAutoCheck: !opts.autoCheck,
        quality: opts.quality as any,
        streamPriorities: [],
        sourcePriorities: [],
        extra: { createTimestamp: Date.now() },
      })

      await saveDB()

      outputSuccess(
        {
          id: recorder.id,
          providerId: recorder.providerId,
          channelId: recorder.channelId,
          remarks: recorder.remarks,
          quality: recorder.quality,
          disableAutoCheck: recorder.disableAutoCheck,
        },
        `Recorder added (id: ${recorder.id})`,
      )
    })
}
