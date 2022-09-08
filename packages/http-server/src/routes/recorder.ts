import { Recorder, RecordHandle } from '@autorecord/manager'
import { Router } from 'express'
import { recorderManager } from '../manager'
import { omit } from '../utils'

const router = Router()

router.route('/recorders').get(async (req, res) => {
  res.json({
    payload: recorderManager.recorders.map((item) => recorderToClient(item)),
  })
})

type ClientRecorder = Omit<
  Recorder,
  'getChannelURL' | 'checkLiveStatusAndRecord' | 'recordHandle' | 'toJSON'
> & {
  channelURL: string
  recordHandle?: Omit<RecordHandle, 'stop'>
}

function recorderToClient(recorder: Recorder): ClientRecorder {
  return {
    ...omit(
      recorder,
      'getChannelURL',
      'checkLiveStatusAndRecord',
      'recordHandle',
      'toJSON'
    ),
    channelURL: recorder.getChannelURL(),
    ...(recorder.recordHandle && omit(recorder.recordHandle, 'stop')),
  }
}

export { router }
