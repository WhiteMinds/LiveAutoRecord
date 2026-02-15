import fs from 'fs'
import path from 'path'
import { JSONFileSync } from '@autorecord/shared'

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg)
  }
}

export function pick<T extends Record<string, any>, U extends keyof T>(object: T, ...props: U[]): Pick<T, U> {
  const result = {} as Pick<T, U>
  for (const prop of props) {
    if (prop in object) {
      result[prop] = object[prop]
    }
  }
  return result
}

export function ensureFileFolderExists(filePath: string) {
  const folder = path.dirname(filePath)
  if (fs.existsSync(folder)) return
  fs.mkdirSync(folder, { recursive: true })
}

export function readJSONFileSync<T = unknown>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) return defaultValue

  try {
    const buffer = fs.readFileSync(filePath)
    return JSON.parse(buffer.toString('utf8')) as T
  } catch (error) {
    return defaultValue
  }
}

export function writeJSONFileSync<T = unknown>(filePath: string, json: T): void {
  ensureFileFolderExists(filePath)
  new JSONFileSync<T>(filePath).write(json)
}
