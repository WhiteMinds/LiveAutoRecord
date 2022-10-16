/**
 * 用一个视频之外的独立文件来存储元信息和弹幕、礼物等信息。
 * 暂时使用 json 作为存储方案试试效果，猜测可能会有实时写入差、占用空间大的问题。
 */
import fs from 'fs'
import { Message } from './common'
import { throttle } from 'lodash'

export interface RecordExtraData {
  meta: {
    title?: string
  }
  /** 这个数组预期上是一个根据 timestamp 排序的有序数组，方便做一些时间段查询 */
  messages: Message[]
}

export interface RecordExtraDataController {
  /** 设计上来说，外部程序不应该能直接修改 data 上的东西 */
  readonly data: RecordExtraData
  addMessage: (message: Message) => void
  setMeta: (meta: Partial<RecordExtraData['meta']>) => void
}

export function createRecordExtraDataController(
  savePath: string
): RecordExtraDataController {
  const data: RecordExtraData = {
    meta: {},
    messages: [],
  }

  // 这里做了节流、单例异步、执行过程中再执行将产生一次 deferSave，最后 deferSaves 会被节流过滤成单个
  let savingPromise: Promise<void> | null = null
  const save = throttle(() => {
    if (savingPromise != null) {
      savingPromise.then(save)
      return
    }

    savingPromise = fs.promises
      .writeFile(savePath, JSON.stringify(data))
      .finally(() => {
        savingPromise = null
      })
  }, 30e3)

  const addMessage: RecordExtraDataController['addMessage'] = (comment) => {
    data.messages.push(comment)
    save()
  }

  const setMeta: RecordExtraDataController['setMeta'] = (meta) => {
    data.meta = {
      ...data.meta,
      ...meta,
    }
    save()
  }

  return {
    data,
    addMessage,
    setMeta,
  }
}
