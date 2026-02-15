import { Command } from 'commander'
import { initManager, recorderManager, enableRecordEvents, getSavePath, saveDB } from '../core/manager-init'
import { logger, outputError, outputSuccess } from '../core/output'

export function createStartCommand(): Command {
  return new Command('start')
    .description('Manually start recording for a recorder')
    .argument('<id>', 'Recorder ID to start')
    .addHelpText(
      'after',
      `
Examples:
  $ lar start 29
  $ lar start 29 --json`,
    )
    .action(async (id: string) => {
      await initManager()
      enableRecordEvents()

      const recorder = recorderManager.recorders.find((r) => r.id === id)
      if (!recorder) {
        outputError(`Recorder not found (id: ${id}). Run "lar list" to see available IDs.`)
        process.exitCode = 1
        return
      }

      if (recorder.recordHandle != null) {
        outputError(`Recorder is already recording (id: ${id}, savePath: ${recorder.recordHandle.savePath})`)
        process.exitCode = 1
        return
      }

      logger.start(`Checking live status for recorder ${id}...`)

      try {
        const recordHandle = await recorder.checkLiveStatusAndRecord({
          getSavePath(data) {
            return getSavePath(recorder, data)
          },
        })

        if (recordHandle) {
          await saveDB()
          outputSuccess(
            {
              id: recorder.id,
              state: recorder.state,
              recordHandle: {
                id: recordHandle.id,
                savePath: recordHandle.savePath,
                stream: recordHandle.stream,
                source: recordHandle.source,
              },
            },
            `Recording started (id: ${id}, savePath: ${recordHandle.savePath})`,
          )
        } else {
          outputSuccess(
            { id: recorder.id, state: recorder.state, recordHandle: null },
            `Channel is not live or recording could not start (id: ${id})`,
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
          outputError(
            `Network error while checking live status. Please check your internet connection.\n  Detail: ${msg}`,
          )
        } else {
          outputError(`Failed to start recording: ${msg}`)
        }
        process.exitCode = 1
      }
    })
}
