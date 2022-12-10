import fs from 'fs'
import path from 'path'
import {
  createRecorderManager,
  Recorder,
  RecorderCreateOpts,
  RecordExtraData,
} from '@autorecord/manager'
import { provider as providerForDouYu } from '@autorecord/douyu-recorder'
import { provider as providerForBilibili } from '@autorecord/bilibili-recorder'
import { provider as providerForHuYa } from '@autorecord/huya-recorder'
import { isDebugMode, paths } from './env'
import {
  pick,
  readJSONFileSync,
  replaceExtName,
  writeJSONFileSync,
} from './utils'
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
import { parseSync, stringifySync } from 'subtitle'

const managerConfigPath = path.join(paths.config, 'manager.json')

export interface RecorderExtra {
  createTimestamp: number
}

export const recorderManager = createRecorderManager<RecorderExtra>({
  providers: [providerForDouYu, providerForBilibili, providerForHuYa],
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
      '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}.mp4'
    ),
    autoCheckLiveStatusAndRecord: true,
    ffmpegOutputArgs: recorderManager.ffmpegOutputArgs,
  })

  // 这里做一些旧版本 schema 升级的处理
  if (managerConfig.ffmpegOutputArgs == null) {
    // v0.0.2 -> v1.0.0
    managerConfig.ffmpegOutputArgs = recorderManager.ffmpegOutputArgs
    managerConfig.savePathRule += '.mp4'
  }

  Object.assign(recorderManager, managerConfig)

  recorderManager.on('Updated', () => {
    writeJSONFileSync<ManagerConfig>(
      managerConfigPath,
      pick(
        recorderManager,
        'savePathRule',
        'autoCheckLiveStatusAndRecord',
        'ffmpegOutputArgs'
      )
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

  recorderManager.on('RecordStop', async ({ recordHandle: { savePath } }) => {
    const { autoGenerateSRTOnRecordStop } = await serverOpts.getSettings()
    if (!autoGenerateSRTOnRecordStop) return

    const extraDataPath = replaceExtName(savePath, '.json')
    if (!fs.existsSync(extraDataPath)) return

    await genSRTFile(extraDataPath, replaceExtName(savePath, '.srt'))
  })
}

// ass 看起来只有序列化和反序列化的库（如 ass-compiler），没有支持帮助排列弹幕的库，
// 要自己实现，成本较高。所以先只简单实现个 srt 的，后面有需要的话再加个 ass 的版本。
export async function genSRTFile(
  extraDataPath: string,
  srtPath: string
): Promise<void> {
  // TODO: 这里要不要考虑用 RecordExtraDataController 去操作？
  const buffer = await fs.promises.readFile(extraDataPath)
  const recordExtraData = JSON.parse(buffer.toString()) as RecordExtraData

  const parsedSRT = parseSync('')

  recordExtraData.messages.forEach((msg) => {
    switch (msg.type) {
      case 'comment':
        const start = msg.timestamp - recordExtraData.meta.recordStartTimestamp
        // TODO: 先简单写个固定值
        const life = 4500
        parsedSRT.push({
          type: 'cue',
          data: {
            start: start,
            end: start + life,
            text: msg.text,
          },
        })
        break
    }
  })

  await fs.promises.writeFile(
    srtPath,
    stringifySync(parsedSRT, { format: 'SRT' })
  )
}

interface ManagerConfig {
  savePathRule: string
  autoCheckLiveStatusAndRecord: boolean
  ffmpegOutputArgs: string
}
