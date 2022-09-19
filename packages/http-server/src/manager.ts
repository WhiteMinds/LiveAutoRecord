import path from 'path'
import { createRecorderManager } from '@autorecord/manager'
import { provider as providerForDY } from '@autorecord/douyu-recorder'
import { getRecorders } from './controller'
import { paths } from './env'

export const recorderManager = createRecorderManager()

export async function initRecorderManager(): Promise<void> {
  // TODO: 之后要从数据库或配置文件里加载
  recorderManager.savePathRule = path.join(
    paths.data,
    '{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}'
  )
  recorderManager.loadRecorderProvider(providerForDY)

  const recorderModels = await getRecorders()
  for (let i = 0; i < recorderModels.length; i++) {
    const { data: serialized } = recorderModels[i]
    recorderManager.addRecorder(serialized.providerId, serialized)
  }

  recorderManager.startCheckLoop()
}
