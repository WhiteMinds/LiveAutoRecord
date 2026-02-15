import { Command } from 'commander'
import { initManager, recorderManager, saveDB } from '../core/manager-init'
import { outputError, outputSuccess } from '../core/output'

export function createRemoveCommand(): Command {
  return new Command('remove')
    .alias('rm')
    .description('Remove a recorder by ID')
    .argument('<id>', 'Recorder ID to remove')
    .addHelpText(
      'after',
      `
Examples:
  $ lar remove 29
  $ lar rm 29 --json`,
    )
    .action(async (id: string) => {
      await initManager()

      const recorder = recorderManager.recorders.find((r) => r.id === id)
      if (!recorder) {
        outputError(`Recorder not found (id: ${id}). Run "lar list" to see available IDs.`)
        process.exitCode = 1
        return
      }

      recorderManager.removeRecorder(recorder)
      await saveDB()

      outputSuccess({ id }, `Recorder removed (id: ${id})`)
    })
}
