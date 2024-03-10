import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { API } from './api_types'
import { asyncRouteHandler, createPagedResultGetter, getNumberFromQuery } from './utils'
import * as db from '../db'
import { assertStringType, replaceExtName } from '../utils'
import { genSRTFile } from '../manager'

const router = Router()

async function getRecords(args: API.getRecords.Args): Promise<API.getRecords.Resp> {
  const pagedGetter = createPagedResultGetter(async (startIdx, count) => {
    const { items, total } = db.getRecords({
      recorderId: args.recorderId,
      start: startIdx,
      count,
    })
    return {
      items: items.map((item) => ({
        ...item,
        isFileExists: fs.existsSync(item.savePath),
      })),
      total,
    }
  })
  return pagedGetter(args.page, args.pageSize)
}

function getRecord(args: API.getRecord.Args): API.getRecord.Resp {
  const record = db.getRecord(args.id)
  if (record == null) throw new Error('404')

  return record
}

router.route('/records').get(
  asyncRouteHandler(async (req, res) => {
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
  }),
)

router.route('/records/clear_invalid').post(
  asyncRouteHandler(async (req, res) => {
    const { recorderId } = req.body
    if (recorderId != null) {
      assertStringType(recorderId)
    }

    const records = await getRecords({ recorderId, page: 1, pageSize: 1e10 })
    const invalidIds = records.items.filter((item) => !item.isFileExists).map((item) => item.id)
    db.removeRecords(invalidIds)

    res.json({ payload: invalidIds.length })
  }),
)

router.route('/records/:id').get((req, res) => {
  const { id } = req.params
  res.json({ payload: getRecord({ id }) })
})

router.route('/records/:id/video').get((req, res) => {
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

router.route('/records/:id/extra_data').get(
  asyncRouteHandler(async (req, res) => {
    const { id } = req.params
    const record = db.getRecord(id)
    if (record == null) {
      res.json({ payload: null }).status(404)
      return
    }

    const extraDataPath = replaceExtName(record.savePath, '.json')
    if (!fs.existsSync(extraDataPath)) {
      res.json({ payload: null }).status(404)
      return
    }

    const buffer = await fs.promises.readFile(extraDataPath)

    res.json({
      payload: JSON.parse(buffer.toString()),
    })
  }),
)

router.route('/records/:id/srt').post(
  asyncRouteHandler(async (req, res) => {
    const { id } = req.params
    const record = db.getRecord(id)
    if (record == null) {
      res.json({ payload: null }).status(404)
      return
    }

    const extraDataPath = replaceExtName(record.savePath, '.json')
    if (!fs.existsSync(extraDataPath)) {
      res.json({ payload: null }).status(404)
      return
    }

    // 感觉不用做什么优化，这里直接覆盖旧文件
    const srtPath = replaceExtName(record.savePath, '.srt')
    await genSRTFile(extraDataPath, srtPath)

    res.json({
      // 考虑到服务端安全，这里就先只返回 filename
      payload: path.basename(srtPath),
    })
  }),
)

export { router }
