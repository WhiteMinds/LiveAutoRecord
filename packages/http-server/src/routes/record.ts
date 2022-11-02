import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { API } from './api_types'
import { createPagedResultGetter, getNumberFromQuery } from './utils'
import * as db from '../db'
import { assertStringType } from '../utils'
import { parseSync, stringifySync } from 'subtitle'
import { RecordExtraData } from '@autorecord/manager'

const router = Router()

async function getRecords(
  args: API.getRecords.Args
): Promise<API.getRecords.Resp> {
  const pagedGetter = createPagedResultGetter(async (startIdx, count) => {
    const { items, total } = db.getRecords({
      recorderId: args.recorderId,
      start: startIdx,
      count,
    })
    return { items, total }
  })
  return pagedGetter(args.page, args.pageSize)
}

router.route('/records').get(async (req, res) => {
  const { recorderId } = req.query
  if (recorderId != null) {
    assertStringType(recorderId)
  }
  const page = getNumberFromQuery(req, 'page', { defaultValue: 1, min: 1 })
  const pageSize = getNumberFromQuery(req, 'pageSize', {
    defaultValue: 10,
    min: 1,
    max: 9999,
  })

  res.json({ payload: await getRecords({ recorderId, page, pageSize }) })
})

router.route('/records/:id/video').get(async (req, res) => {
  const { id } = req.params
  const record = db.getRecord(id)
  if (record == null) {
    res.json({ payload: null }).status(404)
    return
  }

  if (!fs.existsSync(record.savePath)) {
    res.json({ payload: null }).status(404)
    return
  }

  res.download(record.savePath)
})

router.route('/records/:id/extra_data').get(async (req, res) => {
  const { id } = req.params
  const record = db.getRecord(id)
  if (record == null) {
    res.json({ payload: null }).status(404)
    return
  }

  const extraDataPath = path.join(
    path.dirname(record.savePath),
    path.basename(record.savePath, path.extname(record.savePath)) + '.json'
  )
  if (!fs.existsSync(extraDataPath)) {
    res.json({ payload: null }).status(404)
    return
  }

  const buffer = await fs.promises.readFile(extraDataPath)

  res.json({
    payload: JSON.parse(buffer.toString()),
  })
})

router.route('/records/:id/srt').post(async (req, res) => {
  const { id } = req.params
  const record = db.getRecord(id)
  if (record == null) {
    res.json({ payload: null }).status(404)
    return
  }

  const folder = path.dirname(record.savePath)
  const name = path.basename(record.savePath, path.extname(record.savePath))
  const extraDataPath = path.join(folder, name + '.json')
  if (!fs.existsSync(extraDataPath)) {
    res.json({ payload: null }).status(404)
    return
  }

  // 感觉不用做什么优化，这里直接覆盖旧文件
  const srtPath = path.join(folder, name + '.srt')
  await genSRTFile(extraDataPath, srtPath)

  res.json({
    // 考虑到服务端安全，这里就先只返回 filename
    payload: name + '.srt',
  })
})

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

export { router }
