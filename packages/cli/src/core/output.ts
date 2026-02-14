import { createConsola } from 'consola'
import { Table } from 'console-table-printer'

let jsonMode = false

export const logger = createConsola({})

export function setJsonMode(enabled: boolean) {
  jsonMode = enabled
  if (enabled) {
    logger.level = -999
  }
}

export function isJsonMode(): boolean {
  return jsonMode
}

export function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

export function outputTable(columns: { name: string; title?: string; alignment?: 'left' | 'right' | 'center' }[], rows: Record<string, unknown>[]): void {
  const table = new Table({
    columns: columns.map((col) => ({
      name: col.name,
      title: col.title ?? col.name,
      alignment: col.alignment ?? 'left',
    })),
  })
  for (const row of rows) {
    table.addRow(row)
  }
  table.printTable()
}

export function outputSuccess(data: unknown, msg: string): void {
  if (jsonMode) {
    outputJson({ success: true, data })
  } else {
    logger.success(msg)
  }
}

export function outputError(msg: string, data?: unknown): void {
  if (jsonMode) {
    outputJson({ success: false, error: msg, ...(data != null ? { data } : {}) })
  } else {
    logger.error(msg)
  }
}
