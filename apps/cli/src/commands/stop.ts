import { Command } from 'commander'
import { initManager, recorderManager, enableRecordEvents, saveDB } from '../core/manager-init'
import { logger, outputError, outputSuccess } from '../core/output'

export function createStopCommand(): Command {
  return new Command('stop')
    .description('Stop recording for a recorder')
    .argument('<id>', 'Recorder ID to stop')
    .addHelpText('after', `
Examples:
  $ lar stop 29
  $ lar stop 29 --json`)
    .action(async (id: string) => {
      await initManager()
      enableRecordEvents()

      const recorder = recorderManager.recorders.find((r) => r.id === id)
      if (!recorder) {
        outputError(`Recorder not found (id: ${id}). Run "lar list" to see available IDs.`)
        process.exitCode = 1
        return
      }

      if (recorder.recordHandle == null) {
        outputError(`Recorder is not recording (id: ${id}). Current state: ${recorder.state}`)
        process.exitCode = 1
        return
      }

      logger.start(`Stopping recording for recorder ${id}...`)
      await recorder.recordHandle.stop('manual stop via CLI')
      await saveDB()

      outputSuccess(
        { id: recorder.id, state: recorder.state },
        `Recording stopped (id: ${id})`,
      )
    })
}
