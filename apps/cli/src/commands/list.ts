import { Command } from 'commander'
import { initManager, recorderManager } from '../core/manager-init'
import { isJsonMode, outputJson, outputTable } from '../core/output'

export function createListCommand(): Command {
  return new Command('list')
    .alias('ls')
    .description('List all recorders')
    .addHelpText(
      'after',
      `
Examples:
  $ lar list
  $ lar ls --json`,
    )
    .action(async () => {
      await initManager()

      const recorders = recorderManager.recorders.map((r) => ({
        id: r.id,
        platform: r.providerId,
        channelId: r.channelId,
        remarks: r.remarks ?? '',
        state: r.state,
        autoCheck: !r.disableAutoCheck,
      }))

      if (isJsonMode()) {
        outputJson({ success: true, data: recorders })
      } else {
        if (recorders.length === 0) {
          console.log('No recorders found. Use "lar add <url>" to add one.')
          return
        }
        outputTable(
          [
            { name: 'id', title: 'ID' },
            { name: 'platform', title: 'Platform' },
            { name: 'channelId', title: 'Channel' },
            { name: 'remarks', title: 'Remarks' },
            { name: 'state', title: 'State' },
            { name: 'autoCheck', title: 'AutoCheck' },
          ],
          recorders,
        )
      }
    })
}
