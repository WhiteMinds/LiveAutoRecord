import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import R from 'ramda'
import { v4 as uuid } from 'uuid'
import { RecorderProvider } from './manager'
import { SerializedRecorder, Recorder, RecordHandle } from './recorder'
import { AnyObject } from './utils'

ffmpeg.setFfmpegPath(ffmpegPath)

export * from './common'
export * from './recorder'
export * from './manager'
export * from './record_extra_data_controller'

/**
 * 提供一些 utils
 */

export function defaultFromJSON<E extends AnyObject>(
  provider: RecorderProvider<E>,
  json: SerializedRecorder<E>
): Recorder<E> {
  return provider.createRecorder(R.omit(['providerId'], json))
}

export function defaultToJSON<E extends AnyObject>(
  provider: RecorderProvider<E>,
  recorder: Recorder<E>
): SerializedRecorder<E> {
  return {
    providerId: provider.id,
    ...R.pick(
      [
        'id',
        'channelId',
        'remarks',
        'disableAutoCheck',
        'quality',
        'streamPriorities',
        'sourcePriorities',
        'extra',
      ],
      recorder
    ),
  }
}

// 目前是假设使用环境的规模都比较小，不太容易遇到性能问题，所以用 string uuid 作为 id 来简化开发的复杂度。
// 后面如果需要再高一些的规模，可以优化成分布式 id 生成器，或者其他的异步生成 id 的方案。
export function genRecorderUUID(): Recorder['id'] {
  return uuid()
}
export function genRecordUUID(): RecordHandle['id'] {
  return uuid()
}

export const createFFMPEGBuilder = ffmpeg

export function getDataFolderPath<E extends AnyObject>(
  provider: RecorderProvider<E>
): string {
  // TODO: 改成 AppData 之类的目录
  return './' + provider.id
}
