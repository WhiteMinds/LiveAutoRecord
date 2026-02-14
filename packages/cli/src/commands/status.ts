import { Command } from 'commander'
import { initManager, recorderManager } from '../core/manager-init'
import { isJsonMode, outputJson, outputError, outputTable } from '../core/output'

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show detailed status of recorder(s)')
    .argument('[id]', 'Recorder ID (omit to show all)')
    .addHelpText('after', `
Examples:
  $ lar status             # overview of all recorders
  $ lar status 29          # full detail of recorder 29
  $ lar status 29 --json`)
    .action(async (id?: string) => {
      await initManager()

      if (id != null) {
        const recorder = recorderManager.recorders.find((r) => r.id === id)
        if (!recorder) {
          outputError(`Recorder not found (id: ${id}). Run "lar list" to see available IDs.`)
          process.exitCode = 1
          return
        }

        const detail = {
          id: recorder.id,
          providerId: recorder.providerId,
          channelId: recorder.channelId,
          channelURL: recorder.getChannelURL(),
          remarks: recorder.remarks ?? '',
          state: recorder.state,
          quality: recorder.quality,
          disableAutoCheck: recorder.disableAutoCheck ?? false,
          streamPriorities: recorder.streamPriorities,
          sourcePriorities: recorder.sourcePriorities,
          availableStreams: recorder.availableStreams,
          availableSources: recorder.availableSources,
          usedStream: recorder.usedStream,
          usedSource: recorder.usedSource,
          recordHandle: recorder.recordHandle
            ? {
                id: recorder.recordHandle.id,
                savePath: recorder.recordHandle.savePath,
                stream: recorder.recordHandle.stream,
                source: recorder.recordHandle.source,
                url: recorder.recordHandle.url,
              }
            : null,
          extra: recorder.extra,
        }

        if (isJsonMode()) {
          outputJson({ success: true, data: detail })
        } else {
          outputTable(
            [
              { name: 'field', title: 'Field' },
              { name: 'value', title: 'Value' },
            ],
            Object.entries(detail).map(([field, value]) => ({
              field,
              value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
            })),
          )
        }
      } else {
        const recorders = recorderManager.recorders.map((r) => ({
          id: r.id,
          platform: r.providerId,
          channelId: r.channelId,
          remarks: r.remarks ?? '',
          state: r.state,
          quality: r.quality,
          autoCheck: !r.disableAutoCheck,
          recording: r.recordHandle != null,
        }))

        if (isJsonMode()) {
          outputJson({ success: true, data: recorders })
        } else {
          if (recorders.length === 0) {
            console.log('No recorders found.')
            return
          }
          outputTable(
            [
              { name: 'id', title: 'ID' },
              { name: 'platform', title: 'Platform' },
              { name: 'channelId', title: 'Channel' },
              { name: 'remarks', title: 'Remarks' },
              { name: 'state', title: 'State' },
              { name: 'quality', title: 'Quality' },
              { name: 'autoCheck', title: 'AutoCheck' },
              { name: 'recording', title: 'Recording' },
            ],
            recorders,
          )
        }
      }
    })
}
