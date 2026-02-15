import { Command } from 'commander'
import { initManager, recorderManager, enableRecordEvents, saveDB } from '../core/manager-init'
import { isServerRunning } from '../core/server-detect'
import { isJsonMode, logger, outputError, outputJson } from '../core/output'

export function createWatchCommand(): Command {
  return new Command('watch')
    .description('Start daemon mode: continuously monitor and record live streams')
    .addHelpText(
      'after',
      `
Examples:
  $ lar watch              # start daemon mode (human-readable output)
  $ lar watch --json       # NDJSON event stream (one JSON per line)

Notes:
  Cannot run while HTTP server is active on port 8085 (concurrent write conflict).
  Press Ctrl+C to gracefully stop all recordings and exit.`,
    )
    .action(async () => {
      const serverUp = await isServerRunning()
      if (serverUp) {
        outputError(
          'HTTP server is running on port 8085. Cannot run watch mode concurrently.\n' +
            'Stop the server first, or use the web UI to manage recordings.',
        )
        process.exitCode = 1
        return
      }

      await initManager()
      enableRecordEvents()

      recorderManager.on('RecordStart', ({ recorder, recordHandle }) => {
        if (isJsonMode()) {
          outputJson({
            event: 'RecordStart',
            timestamp: Date.now(),
            data: {
              recorderId: recorder.id,
              channelId: recorder.channelId,
              remarks: recorder.remarks,
              recordId: recordHandle.id,
              savePath: recordHandle.savePath,
            },
          })
        } else {
          logger.success(
            `[RecordStart] ${recorder.remarks ?? recorder.channelId} (${recorder.id}) -> ${recordHandle.savePath}`,
          )
        }
      })

      recorderManager.on('RecordStop', ({ recorder, recordHandle, reason }) => {
        saveDB()
        if (isJsonMode()) {
          outputJson({
            event: 'RecordStop',
            timestamp: Date.now(),
            data: {
              recorderId: recorder.id,
              channelId: recorder.channelId,
              remarks: recorder.remarks,
              recordId: recordHandle.id,
              reason,
            },
          })
        } else {
          logger.info(
            `[RecordStop] ${recorder.remarks ?? recorder.channelId} (${recorder.id}) reason: ${reason ?? 'unknown'}`,
          )
        }
      })

      recorderManager.on('RecorderUpdated', ({ recorder, keys }) => {
        if (isJsonMode()) {
          outputJson({
            event: 'RecorderUpdated',
            timestamp: Date.now(),
            data: {
              recorderId: recorder.id,
              updatedKeys: keys,
            },
          })
        }
      })

      recorderManager.startCheckLoop()

      const activeCount = recorderManager.recorders.filter((r) => !r.disableAutoCheck).length
      if (isJsonMode()) {
        outputJson({
          event: 'WatchStarted',
          timestamp: Date.now(),
          data: { totalRecorders: recorderManager.recorders.length, activeRecorders: activeCount },
        })
      } else {
        logger.info(
          `Watch mode started. Monitoring ${activeCount}/${recorderManager.recorders.length} recorders. Press Ctrl+C to stop.`,
        )
      }

      let stopping = false
      const gracefulStop = async () => {
        if (stopping) return
        stopping = true

        if (isJsonMode()) {
          outputJson({ event: 'WatchStopping', timestamp: Date.now() })
        } else {
          logger.info('Stopping watch mode...')
        }

        recorderManager.stopCheckLoop()

        const activeRecordings = recorderManager.recorders.filter((r) => r.recordHandle != null)
        if (activeRecordings.length > 0) {
          if (!isJsonMode()) {
            logger.info(`Stopping ${activeRecordings.length} active recording(s)...`)
          }
          const stopPromises = activeRecordings.map((r) => r.recordHandle!.stop('watch mode exit'))
          await Promise.allSettled(stopPromises)
        }

        await saveDB()

        if (isJsonMode()) {
          outputJson({ event: 'WatchStopped', timestamp: Date.now() })
        } else {
          logger.success('Watch mode stopped')
        }

        process.exit(0)
      }

      process.on('SIGINT', () => {
        gracefulStop()
      })
      process.on('SIGTERM', () => {
        gracefulStop()
      })

      // 保持进程运行
      await new Promise(() => {})
    })
}
