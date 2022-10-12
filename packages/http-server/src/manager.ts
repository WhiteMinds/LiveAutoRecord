import path from 'path'
import { createRecorderManager, SerializedRecorder } from '@autorecord/manager'
import { provider as providerForDY } from '@autorecord/douyu-recorder'
import { paths } from './env'
import { asyncDebounce, readJSONFile, writeJSONFile } from './utils'
import { insertRecord, updateRecordStopTime } from './db'

const recordersConfigPath = path.join(paths.config, 'recorders.json')
const managerConfigPath = path.join(paths.config, 'manager.json')

export const recorderManager = createRecorderManager()

export async function initRecorderManager(): Promise<void> {
  recorderManager.loadRecorderProvider(providerForDY)

  const managerConfig = await readJSONFile<ManagerConfig>(managerConfigPath, {
    savePathRule: path.join(
      paths.data,
      '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}'
    ),
  })
  recorderManager.savePathRule = managerConfig.savePathRule

  const serializedRecorders = await readJSONFile<SerializedRecorder[]>(
    recordersConfigPath,
    []
  )
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
