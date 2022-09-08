import { createRecorderManager } from '@autorecord/manager'
import { provider as providerForDY } from '@autorecord/douyu-recorder'
import { getRecorders } from './controller'

export const recorderManager = createRecorderManager()

export async function initRecorderManager(): Promise<void> {
  recorderManager.loadRecorderProvider(providerForDY)

  const recorderModels = await getRecorders()
  for (let i = 0; i < recorderModels.length; i++) {
    const { data: serialized } = recorderModels[i]
    recorderManager.addRecorder(serialized.providerId, serialized)
  }
}
