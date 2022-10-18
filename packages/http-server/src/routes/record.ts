import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { API } from './api_types'
import { createPagedResultGetter, getNumberFromQuery } from './utils'
import * as db from '../db'
import { assertStringType } from '../utils'

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

export { router }
