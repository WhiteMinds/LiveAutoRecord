import path from 'path'
import { createRecorderManager, genSavePathFromRule, Recorder, RecorderCreateOpts } from '@autorecord/manager'
import { provider as providerForDouYu } from '@autorecord/douyu-recorder'
import { provider as providerForBilibili } from '@autorecord/bilibili-recorder'
import { provider as providerForHuYa } from '@autorecord/huya-recorder'
import { provider as providerForDouYin } from '@autorecord/douyin-recorder'
import { paths, pick, readJSONFileSync, writeJSONFileSync } from '@autorecord/core'
import type { RecorderExtra, ManagerConfig } from '@autorecord/core'
import { managerConfigKeys } from '@autorecord/core'
import {
  genRecorderIdInDB,
  getRecorders,
  initDB,
  insertRecord,
  insertRecorder,
  removeRecorder,
  updateRecorder,
  updateRecordStopData,
  saveDB,
} from './db'
import { logger } from './output'

export const managerConfigPath = path.join(paths.config, 'manager.json')

export type { RecorderExtra, ManagerConfig }
export { managerConfigKeys }

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [providerForDouYu, providerForBilibili, providerForHuYa, providerForDouYin],
})

export const defaultManagerConfig: ManagerConfig = {
  savePathRule: path.join(paths.data, '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4'),
  autoRemoveSystemReservedChars: true,
  autoCheckLiveStatusAndRecord: true,
  autoCheckInterval: 1000,
  ffmpegOutputArgs: recorderManager.ffmpegOutputArgs,
}

export function addRecorderWithAutoIncrementId(args: RecorderCreateOpts<RecorderExtra>): Recorder<RecorderExtra> {
  return recorderManager.addRecorder({
    ...args,
    id: genRecorderIdInDB().toString(),
  })
}

export function getSavePath(recorder: Recorder<RecorderExtra>, data: { owner: string; title: string }): string {
  return genSavePathFromRule(recorderManager, recorder, data)
}

let initialized = false

export async function initManager(): Promise<void> {
  if (initialized) return
  initialized = true

  await initDB()

  const managerConfig = readJSONFileSync<ManagerConfig>(managerConfigPath, defaultManagerConfig)

  // 旧版本 schema 升级
  if (managerConfig.ffmpegOutputArgs == null) {
    managerConfig.ffmpegOutputArgs = recorderManager.ffmpegOutputArgs
    managerConfig.savePathRule += '.mp4'
  }
  if (managerConfig.autoRemoveSystemReservedChars == null) {
    managerConfig.autoRemoveSystemReservedChars = true
  }

  Object.assign(recorderManager, managerConfig)

  recorderManager.on('error', ({ source, err }) => {
    const errText = err instanceof Error ? (err.stack ?? err.message) : JSON.stringify(err)
    logger.error(`[RecorderManager][${source}]: ${errText}`)
  })

  recorderManager.on('Updated', () => {
    writeJSONFileSync<ManagerConfig>(
      managerConfigPath,
      pick(
        recorderManager,
        'savePathRule',
        'autoRemoveSystemReservedChars',
        'autoCheckLiveStatusAndRecord',
        'autoCheckInterval',
        'ffmpegOutputArgs',
      ),
    )
  })

  // 从 DB 加载 recorders
  const serializedRecorders = getRecorders()
  for (let i = 0; i < serializedRecorders.length; i++) {
    const serialized = serializedRecorders[i]
    recorderManager.addRecorder(serialized)
  }

  // DB 同步事件
  recorderManager.on('RecorderAdded', (recorder) => insertRecorder(recorder.toJSON()))
  recorderManager.on('RecorderRemoved', (recorder) => removeRecorder(recorder.id))
  recorderManager.on('RecorderUpdated', ({ recorder }) => updateRecorder(recorder.toJSON()))
}

let recordEventsEnabled = false

/**
 * 启用 RecordStart/RecordStop 事件处理，将录制记录同步到 DB。
 * start/stop/check/watch 命令需要调用此函数。
 */
export function enableRecordEvents(): void {
  if (recordEventsEnabled) return
  recordEventsEnabled = true

  recorderManager.on('RecordStart', ({ recorder, recordHandle }) => {
    const recordId = recordHandle.id

    insertRecord({
      id: recordId,
      recorderId: recorder.id,
      savePath: recordHandle.savePath,
      startTimestamp: Date.now(),
    })

    const onRecordStop: Parameters<typeof recorderManager.on<'RecordStop'>>[1] = ({ recordHandle, reason }) => {
      if (recordHandle.id !== recordId) return
      recorderManager.off('RecordStop', onRecordStop)

      updateRecordStopData({
        id: recordId,
        stopTimestamp: Date.now(),
        stopReason: reason,
      })
    }

    recorderManager.on('RecordStop', onRecordStop)
  })
}

export { saveDB }
