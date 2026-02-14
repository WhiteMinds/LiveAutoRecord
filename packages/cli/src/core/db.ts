import path from 'path'
import {
  Low,
  JSONFile,
  paths,
  assert,
  ensureFileFolderExists,
} from '@autorecord/core'
import type { DatabaseSchema, RecordModel, RecorderModel, QueryRecordsOpts } from '@autorecord/core'

export type { DatabaseSchema, RecordModel, RecorderModel, QueryRecordsOpts }

const dbPath = path.join(paths.data, 'data.json')
const adapter = new JSONFile<DatabaseSchema>(dbPath)
const db = new Low(adapter)

export async function initDB(): Promise<void> {
  try {
    await db.read()
  } catch (error) {
    throw new Error(`Failed to read database at ${dbPath}: ${error}`)
  }
  if (db.data == null) {
    db.data = { records: [], recorders: [], nextRecorderId: 1 }
  }

  // 旧版本 schema 升级
  if (db.data.recorders == null) {
    db.data.recorders = []
    db.data.nextRecorderId = 1
  }
}

function assertDBReady<T>(db: Low<T>): asserts db is Low<T> & { data: T } {
  return assert(db.data, 'Must initialize the db before using it')
}

export async function saveDB(): Promise<void> {
  ensureFileFolderExists(dbPath)
  await db.write()
}

export function getRecorders(): RecorderModel[] {
  assertDBReady(db)
  return db.data.recorders
}

export function insertRecorder(props: RecorderModel): void {
  assertDBReady(db)
  db.data.recorders.push(props)
}

export function removeRecorder(id: RecorderModel['id']): void {
  assertDBReady(db)
  const idx = db.data.recorders.findIndex((recorder) => recorder.id === id)
  if (idx === -1) return
  db.data.recorders.splice(idx, 1)
}

export function updateRecorder(props: RecorderModel): void {
  assertDBReady(db)
  const { id, ...data } = props
  const recorder = db.data.recorders.find((recorder) => recorder.id === id)
  if (recorder == null) return
  Object.assign(recorder, data)
}

export function genRecorderIdInDB(): number {
  assertDBReady(db)
  return db.data.nextRecorderId++
}

// Record CRUD

export function insertRecord(props: RecordModel): void {
  assertDBReady(db)
  db.data.records.push(props)
}

export function removeRecord(id: RecordModel['id']): void {
  assertDBReady(db)
  const idx = db.data.records.findIndex((record) => record.id === id)
  if (idx === -1) return
  db.data.records.splice(idx, 1)
}

export function updateRecordStopData(
  props: Required<Pick<RecordModel, 'id' | 'stopTimestamp'>> & Pick<RecordModel, 'stopReason'>,
): void {
  assertDBReady(db)
  const record = db.data.records.find((record) => record.id === props.id)
  if (record == null) return
  record.stopTimestamp = props.stopTimestamp
  record.stopReason = props.stopReason
}

export function getRecords(opts: QueryRecordsOpts = {}): {
  items: RecordModel[]
  total: number
} {
  assertDBReady(db)

  let items = db.data.records
  if (opts.recorderId != null) {
    items = items.filter((item) => item.recorderId === opts.recorderId)
  }
  const total = items.length
  if (opts.start != null) {
    items = items.slice(opts.start)
  }
  if (opts.count != null) {
    items = items.slice(0, opts.count)
  }

  return { items, total }
}
