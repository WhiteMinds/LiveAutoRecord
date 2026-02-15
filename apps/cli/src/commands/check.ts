import { Command } from 'commander'
import { initManager, recorderManager, enableRecordEvents, getSavePath, saveDB } from '../core/manager-init'
import { isJsonMode, logger, outputJson, outputError } from '../core/output'

export function createCheckCommand(): Command {
  return new Command('check')
    .description('Check live status and start recording if live (one-shot)')
    .argument('[id]', 'Recorder ID (omit to check all with autoCheck enabled)')
    .addHelpText(
      'after',
      `
Examples:
  $ lar check              # check all auto-check-enabled recorders
  $ lar check 29           # check a specific recorder
  $ lar check --json`,
    )
    .action(async (id?: string) => {
      await initManager()
      enableRecordEvents()

      const recorders =
        id != null
          ? recorderManager.recorders.filter((r) => r.id === id)
          : recorderManager.recorders.filter((r) => !r.disableAutoCheck)

      if (id != null && recorders.length === 0) {
        outputError(`Recorder not found (id: ${id}). Run "lar list" to see available IDs.`)
        process.exitCode = 1
        return
      }

      logger.info(`Checking ${recorders.length} recorder(s)...`)

      const results: { id: string; channelId: string; state: string; started: boolean }[] = []

      for (const recorder of recorders) {
        try {
          const recordHandle = await recorder.checkLiveStatusAndRecord({
            getSavePath(data) {
              return getSavePath(recorder, data)
            },
          })

          const started = recordHandle != null
          results.push({
            id: recorder.id,
            channelId: recorder.channelId,
            state: recorder.state,
            started,
          })

          if (started) {
            logger.success(`[${recorder.id}] Recording started: ${recordHandle.savePath}`)
          } else {
            logger.info(`[${recorder.id}] Not live or already recording`)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error(`[${recorder.id}] Check failed: ${msg}`)
          results.push({
            id: recorder.id,
            channelId: recorder.channelId,
            state: recorder.state,
            started: false,
          })
        }
      }

      await saveDB()

      const activeRecordings = recorderManager.recorders.filter((r) => r.recordHandle != null)

      if (isJsonMode()) {
        outputJson({
          success: true,
          data: { results, activeRecordings: activeRecordings.length },
        })
      } else {
        const startedCount = results.filter((r) => r.started).length
        logger.success(
          `Check complete: ${results.length} checked, ${startedCount} started, ${activeRecordings.length} active`,
        )
      }

      if (activeRecordings.length > 0) {
        logger.info(`Waiting for ${activeRecordings.length} active recording(s) to finish...`)
        logger.info('Press Ctrl+C to stop all recordings and exit')

        await new Promise<void>((resolve) => {
          const checkDone = () => {
            const remaining = recorderManager.recorders.filter((r) => r.recordHandle != null)
            if (remaining.length === 0) {
              resolve()
            }
          }

          recorderManager.on('RecordStop', () => {
            checkDone()
          })

          const gracefulStop = async () => {
            logger.info('Stopping all recordings...')
            const stopPromises = recorderManager.recorders
              .filter((r) => r.recordHandle != null)
              .map((r) => r.recordHandle!.stop('CLI check exit'))
            await Promise.allSettled(stopPromises)
            await saveDB()
            resolve()
          }

          process.on('SIGINT', () => {
            gracefulStop()
          })
          process.on('SIGTERM', () => {
            gracefulStop()
          })
        })

        await saveDB()
      }
    })
}
