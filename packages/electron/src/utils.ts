import fs from 'fs'
import path from 'path'
import { JSONFile, JSONFileSync } from '@autorecord/shared'
import { logger } from './logger'

export async function readJSONFile<T = unknown>(filePath: string, defaultValue: T): Promise<T> {
  if (!fs.existsSync(filePath)) return defaultValue

  try {
    const buffer = await fs.promises.readFile(filePath)
    return JSON.parse(buffer.toString('utf8')) as T
  } catch (error) {
    logger.error('readJSONFile error', filePath, error)
    return defaultValue
  }
}

export function readJSONFileSync<T = unknown>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) return defaultValue

  try {
    const buffer = fs.readFileSync(filePath)
    return JSON.parse(buffer.toString('utf8')) as T
  } catch (error) {
    logger.error('readJSONFileSync error', filePath, error)
    return defaultValue
  }
}

export async function writeJSONFile<T = unknown>(filePath: string, json: T): Promise<void> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await new JSONFile<T>(filePath).write(json)
}

export function writeJSONFileSync<T = unknown>(filePath: string, json: T): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  new JSONFileSync<T>(filePath).write(json)
}
