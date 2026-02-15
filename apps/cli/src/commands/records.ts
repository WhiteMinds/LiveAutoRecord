import { Command } from 'commander'
import { initManager } from '../core/manager-init'
import { getRecords } from '../core/db'
import { isJsonMode, outputJson, outputTable } from '../core/output'

export function createRecordsCommand(): Command {
  return new Command('records')
    .description('View recording history')
    .option('--recorder-id <id>', 'Filter by recorder ID')
    .option('--limit <count>', 'Limit number of results', '50')
    .option('--offset <start>', 'Skip first N results', '0')
    .addHelpText(
      'after',
      `
Examples:
  $ lar records                         # show latest 50 records
  $ lar records --recorder-id 29        # filter by recorder
  $ lar records --limit 10              # show only 10 records
  $ lar records --offset 50 --limit 20  # pagination
  $ lar records --json                  # JSON output`,
    )
    .action(async (opts: { recorderId?: string; limit: string; offset: string }) => {
      await initManager()

      const limit = parseInt(opts.limit, 10)
      const offset = parseInt(opts.offset, 10)

      const { items, total } = getRecords({
        recorderId: opts.recorderId,
        start: offset > 0 ? offset : undefined,
        count: limit > 0 ? limit : undefined,
      })

      if (isJsonMode()) {
        outputJson({
          success: true,
          data: { items, total, offset, limit },
        })
      } else {
        if (items.length === 0) {
          console.log('No records found.')
          return
        }

        const rows = items.map((r) => ({
          id: r.id.slice(0, 8),
          recorderId: r.recorderId,
          savePath: r.savePath.length > 60 ? '...' + r.savePath.slice(-57) : r.savePath,
          start: new Date(r.startTimestamp).toLocaleString(),
          stop: r.stopTimestamp ? new Date(r.stopTimestamp).toLocaleString() : '-',
          duration: r.stopTimestamp ? formatDuration(r.stopTimestamp - r.startTimestamp) : '-',
        }))

        outputTable(
          [
            { name: 'id', title: 'ID' },
            { name: 'recorderId', title: 'Recorder' },
            { name: 'savePath', title: 'Save Path' },
            { name: 'start', title: 'Start' },
            { name: 'stop', title: 'Stop' },
            { name: 'duration', title: 'Duration' },
          ],
          rows,
        )

        console.log(`Showing ${items.length} of ${total} records`)
      }
    })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h${minutes}m${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m${seconds}s`
  }
  return `${seconds}s`
}
