import _ from 'lodash'
import DM3 from '@/db-dm3'
import { Platform, DM3DataType } from 'const'

export async function DanmakuToAss (danmakuFilePath, opts) {
  opts = _.merge({
    width: 1920,
    height: 1080
  }, opts)

  const dm3 = await DM3(danmakuFilePath)
  const recordInfo = (await dm3.Data.findBy({ type: DM3DataType.RecordInfo })).value
  const danmakuList = (await dm3.Data.findAllBy({ type: DM3DataType.Message }))
    .map(data => Object.assign({}, data.value, { time: data.relativeTime }))
    .map(msg => {
      switch (recordInfo.platform) {
        case Platform.DouYu:
          break
      }
    })
    .filter(msg => msg)

  console.log(danmakuList)
}
