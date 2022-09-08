import { Recorder } from '../db'
import { RecorderAttrs } from '../db/recorder'

export async function createRecorder(
  data: RecorderAttrs['data']
): Promise<Recorder> {
  return Recorder.create({
    data,
  })
}

export async function getRecorders(): Promise<Recorder[]> {
  return Recorder.findAll()
}

// export async function getRecorder(
//   id: Recorder['id']
// ): Promise<Recorder | null> {
//   return Recorder.findByPk(id)
// }
