/**
 * 预期上这里要选一个轻量级的文件数据库，从调研结果看，sqlite 的库基本都要 native 模块，
 * 这会提升 node / electron 混合的项目的复杂度，因为需要经常切换 electron-build & node-gyp 编译。
 * 所以最后选了其他的文件类型，目前使用 json 库来尝试看看，缺点是这些字符串类型的库
 * 都需要数据库全量载入到内存，对于内存占用和文件空间占用都会偏大。
 */
import { Recorder, RecordHandle } from '@autorecord/manager'
import path from 'path'
import { Low, JSONFile } from './lowdb'
import { paths } from '../env'
import { assert, asyncThrottle } from '../utils'

export interface DatabaseSchema {
  records: RecordModel[]
}

export interface RecordModel {
  id: RecordHandle['id']
  recorderId: Recorder['id']
  savePath: string
  startTimestamp: number
  stopTimestamp?: number
}

const dbPath = path.join(paths.data, 'data.json')
const adapter = new JSONFile<DatabaseSchema>(dbPath)
const db = new Low(adapter)

export async function initDB() {
  await db.read()
  if (db.data == null) {
    db.data = { records: [] }
  }
}

function assertDBReady<T>(db: Low<T>): asserts db is Low<T> & { data: T } {
  return assert(db.data, 'Must initialize the db before using it')
}

// TODO: 可能需要一个双文件缓冲写入的机制，防止意外情况写入中断文件损坏，lowdb 好像已经做了？
// TODO: 测试暂时用 1s
const scheduleSave = asyncThrottle(() => db.write(), 1e3)

export interface QueryRecordsOpts {
  recorderId?: Recorder['id']
  start?: number
  count?: number
}
export function getRecords(opts: QueryRecordsOpts = {}): {
  items: RecordModel[]
  total: number
} {
  assertDBReady(db)

  // TODO: 之后性能有问题的话应该可以用 transduce 做优化
  let items = db.data.records
  if (opts.recorderId != null) {
    items = items.filter((item) => item.recorderId === opts.recorderId)
  }
  const count = items.length
  if (opts.start != null) {
    items = items.slice(opts.start)
  }
  if (opts.count != null) {
    items = items.slice(0, opts.count)
  }

  return { items, total: count }
}

export type InsertRecordProps = RecordModel

export function insertRecord(props: InsertRecordProps): void {
  assertDBReady(db)
  const model: RecordModel = props
  db.data.records.push(model)
  scheduleSave()
}

export function updateRecordStopTime(
  props: Required<Pick<RecordModel, 'id' | 'stopTimestamp'>>
): void {
  assertDBReady(db)
  // TODO: 性能有问题的话可以在 insert 时做个索引表
  const record = db.data.records.find((record) => record.id === props.id)
  if (record == null) return

  record.stopTimestamp = props.stopTimestamp
  scheduleSave()
}
