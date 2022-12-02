import path from 'path'
import { createRecorderManager, SerializedRecorder } from '@autorecord/manager'
import { provider as providerForDouYu } from '@autorecord/douyu-recorder'
import { provider as providerForBilibili } from '@autorecord/bilibili-recorder'
import { isDebugMode, paths } from './env'
import { asyncDebounce, readJSONFile, writeJSONFile } from './utils'
import { insertRecord, updateRecordStopTime } from './db'
import { ServerOpts } from './types'

const recordersConfigPath = path.join(paths.config, 'recorders.json')
const managerConfigPath = path.join(paths.config, 'manager.json')

export interface RecorderExtra {
  createTimestamp: number
}

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [providerForDouYu, providerForBilibili],
})

export async function initRecorderManager(
  serverOpts: ServerOpts
): Promise<void> {
  const { logger } = serverOpts

  const managerConfig = await readJSONFile<ManagerConfig>(managerConfigPath, {
    savePathRule: path.join(
      paths.data,
      '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}'
    ),
  })
  recorderManager.savePathRule = managerConfig.savePathRule

  // TODO: 目前持久化的实现方式是不支持多实例同时运行的，考虑在程序运行期间把数据文件持续占用防止意外操作
  const serializedRecorders = await readJSONFile<
    SerializedRecorder<RecorderExtra>[]
  >(recordersConfigPath, [])
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

  recorderManager.on('RecorderAdded', saveRecordersConfig)
  recorderManager.on('RecorderRemoved', saveRecordersConfig)
  recorderManager.on('RecorderUpdated', saveRecordersConfig)
}

// TODO: 应该在程序即将退出时立刻触发缓冲的函数
export const saveRecordersConfig = asyncDebounce(async () => {
  return writeJSONFile(
    recordersConfigPath,
    recorderManager.recorders.map((r) => r.toJSON())
  )
  // TODO: 测试先改短点，后面改成 30e3
}, 3e3)

interface ManagerConfig {
  savePathRule: string
}
