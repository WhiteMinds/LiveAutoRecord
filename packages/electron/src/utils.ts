import fs from 'fs'
import path from 'path'

export async function readJSONFile<T = unknown>(filePath: string, defaultValue: T): Promise<T> {
  if (!fs.existsSync(filePath)) return defaultValue

  const buffer = await fs.promises.readFile(filePath)
  return JSON.parse(buffer.toString('utf8')) as T
}

export function readJSONFileSync<T = unknown>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) return defaultValue

  const buffer = fs.readFileSync(filePath)
  return JSON.parse(buffer.toString('utf8')) as T
}

export async function writeJSONFile<T = unknown>(filePath: string, json: T): Promise<void> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, JSON.stringify(json))
}

export function writeJSONFileSync<T = unknown>(filePath: string, json: T): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(json))
}
