/**
 * 用 sequelize 做 ORM 太重了，这个应用更适合轻量一点的，所以选了 better-sqlite3
 */
import { Recorder, RecordHandle } from '@autorecord/manager'
import Database, { Statement, Transaction } from 'better-sqlite3'
import path from 'path'
import { paths } from '../env'

const dbPath = path.join(paths.data, 'data.sqlite')
console.log({ dbPath })

const db = new Database(dbPath, {
  verbose: (sql) => console.log('exec sql:', sql),
})

// 注意，这里改了就要改创建表的语句
export interface RecordModel {
  id: RecordHandle['id']
  recorderId: Recorder['id']
  savePath: string
  startTimestamp: number
  stopTimestamp?: number
}
db.exec(`
CREATE TABLE IF NOT EXISTS records(
  id TEXT PRIMARY KEY,
  recorderId TEXT NOT NULL,
  savePath TEXT NOT NULL,
  startTimestamp DATE NOT NULL,
  stopTimestamp DATE
);
`)

interface QueryRecordsOpts {
  recorderId?: Recorder['id']
  start?: number
  count?: number
}
export function getRecords(opts: QueryRecordsOpts = {}): {
  items: RecordModel[]
  total: number
} {
  // TODO: 不知道这个库的最佳实践是不是类似这样的，先糊着，后面再研究研究

  let conditionSql = ''
  if (opts.recorderId != null) {
    conditionSql = ' where recorderId = @recorderId'
  }

  let cursorSql = ''
  if (opts.count != null) {
    cursorSql += ' limit @count'
  }
  if (opts.start != null) {
    cursorSql += ' offset @start'
  }

  let selectSql = 'SELECT * from records'
  const selectStmt = db.prepare<QueryRecordsOpts>(
    selectSql + conditionSql + cursorSql
  )

  let countSql = 'SELECT count(*) as count from records'
  const countStmt = db.prepare<Omit<QueryRecordsOpts, 'start' | 'count'>>(
    countSql + conditionSql
  )
  const { count } = countStmt.get({ recorderId: opts.recorderId }) as {
    count: number
  }

  // 这个类型没办法，声明里写死了 any
  const items = selectStmt.all(opts) as RecordModel[]

  return { items, total: count }
}

// 注意，这里改了就要改插入的语句
type InsertRecordProps = RecordModel
// better-sqlite3 内部用的类型在一个未公开的 namespace BetterSqlite3 上，这里要导出的话
// 无法用它的泛型自动推断，只能手动约束。不知道是不是故意这么设计的，感觉像 bug。
const _insertRecord: Statement<[InsertRecordProps]> = db.prepare(
  'INSERT INTO records (id, recorderId, savePath, startTimestamp) VALUES (@id, @recorderId, @savePath, @startTimestamp)'
)
export const insertRecord = _insertRecord.run.bind(_insertRecord)

// TODO: 这里不支持泛型，已经提 PR 了等 merge 后 upgrade，目前先 patch
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/62623
export const insertRecords: Transaction<(items: InsertRecordProps[]) => void> =
  db.transaction((items) => {
    for (const item of items) _insertRecord.run(item)
  })

const _updateRecordStopTime: Statement<
  Required<Pick<RecordModel, 'id' | 'stopTimestamp'>>
> = db.prepare(
  'UPDATE records set stopTimestamp = @stopTimestamp where id = @id'
)
export const updateRecordStopTime = _updateRecordStopTime.run.bind(
  _updateRecordStopTime
)
