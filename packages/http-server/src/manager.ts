import path from 'path'
import {
  createRecorderManager,
  Recorder,
  RecorderCreateOpts,
} from '@autorecord/manager'
import { provider as providerForDouYu } from '@autorecord/douyu-recorder'
import { provider as providerForBilibili } from '@autorecord/bilibili-recorder'
import { isDebugMode, paths } from './env'
import { pick, readJSONFileSync, writeJSONFileSync } from './utils'
import {
  genRecorderIdInDB,
  getRecorders,
  insertRecord,
  insertRecorder,
  removeRecorder,
  updateRecorder,
  updateRecordStopTime,
} from './db'
import { ServerOpts } from './types'

const managerConfigPath = path.join(paths.config, 'manager.json')

export interface RecorderExtra {
  createTimestamp: number
}

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [providerForDouYu, providerForBilibili],
})

export function addRecorderWithAutoIncrementId(
  args: RecorderCreateOpts<RecorderExtra>
): Recorder<RecorderExtra> {
  return recorderManager.addRecorder({
    ...args,
    id: genRecorderIdInDB().toString(),
  })
}

export async function initRecorderManager(
  serverOpts: ServerOpts
): Promise<void> {
  const { logger } = serverOpts

  const managerConfig = readJSONFileSync<ManagerConfig>(managerConfigPath, {
    savePathRule: path.join(
      paths.data,
      '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}'
    ),
    autoCheckLiveStatusAndRecord: true,
  })
  Object.assign(recorderManager, managerConfig)

  recorderManager.on('Updated', () => {
    writeJSONFileSync<ManagerConfig>(
      managerConfigPath,
      pick(recorderManager, 'savePathRule', 'autoCheckLiveStatusAndRecord')
    )
  })

  // TODO: 目前持久化的实现方式是不支持多实例同时运行的，考虑在程序运行期间把数据文件持续占用防止意外操作
  const serializedRecorders = getRecorders()
  for (let i = 0; i < serializedRecorders.length; i++) {
    const serialized = serializedRecorders[i]
    recorderManager.addRecorder(serialized)
  }

  if (recorderManager.autoCheckLiveStatusAndRecord) {
    recorderManager.startCheckLoop()
  }

  recorderManager.on('RecordStart', ({ recorder, recordHandle }) => {
    const recordId = recordHandle.id

    insertRecord({
      id: recordId,
      recorderId: recorder.id,
      savePath: recordHandle.savePath,
      startTimestamp: Date.now(),
    })

    const updateRecordOnceRecordStop: Parameters<
      typeof recorderManager.on<'RecordStop'>
    >[1] = ({ recordHandle }) => {
      if (recordHandle.id !== recordId) return

      updateRecordStopTime({
        id: recordId,
        stopTimestamp: Date.now(),
      })

      recorderManager.off('RecordStop', updateRecordOnceRecordStop)
    }

    recorderManager.on('RecordStop', updateRecordOnceRecordStop)
  })

  recorderManager.on('RecorderDebugLog', ({ recorder, ...log }) => {
    if (!isDebugMode) return
    logger.debug(`[${recorder.id}][${log.type}]: ${log.text}`)
  })

  recorderManager.on('RecorderAdded', (recorder) =>
    insertRecorder(recorder.toJSON())
  )
  recorderManager.on('RecorderRemoved', (recorder) =>
    removeRecorder(recorder.id)
  )
  recorderManager.on('RecorderUpdated', ({ recorder }) =>
    updateRecorder(recorder.toJSON())
  )
}

interface ManagerConfig {
  savePathRule: string
  autoCheckLiveStatusAndRecord: boolean
}
