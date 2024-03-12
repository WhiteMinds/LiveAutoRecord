/**
 * Copied from https://github.com/typicode/lowdb/blob/6fc49ccb69666ad9159d1403514549a6af5fa8ef/src/adapters/node/JSONFile.ts
 *
 * 用 lowdb 的 JSONFile 主要是为了利用它的原子写入功能
 */

import { PathLike, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Writer } from './steno'

export interface Adapter<T> {
  read: () => Promise<T | null>
  write: (data: T) => Promise<void>
}

export interface SyncAdapter<T> {
  read: () => T | null
  write: (data: T) => void
}

export class TextFile implements Adapter<string> {
  #filename: PathLike
  #writer: Writer

  constructor(filename: PathLike) {
    this.#filename = filename
    this.#writer = new Writer(filename)
  }

  async read(): Promise<string | null> {
    let data

    try {
      data = await readFile(this.#filename, 'utf-8')
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw e
    }

    return data
  }

  write(str: string): Promise<void> {
    return this.#writer.write(str)
  }
}

export class TextFileSync implements SyncAdapter<string> {
  #tempFilename: PathLike
  #filename: PathLike

  constructor(filename: PathLike) {
    this.#filename = filename
    const f = filename.toString()
    this.#tempFilename = path.join(path.dirname(f), `.${path.basename(f)}.tmp`)
  }

  read(): string | null {
    let data

    try {
      data = readFileSync(this.#filename, 'utf-8')
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw e
    }

    return data
  }

  write(str: string): void {
    writeFileSync(this.#tempFilename, str)
    renameSync(this.#tempFilename, this.#filename)
  }
}

export class DataFile<T> implements Adapter<T> {
  #adapter: TextFile
  #parse: (str: string) => T
  #stringify: (data: T) => string

  constructor(
    filename: PathLike,
    {
      parse,
      stringify,
    }: {
      parse: (str: string) => T
      stringify: (data: T) => string
    },
  ) {
    this.#adapter = new TextFile(filename)
    this.#parse = parse
    this.#stringify = stringify
  }

  async read(): Promise<T | null> {
    const data = await this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return this.#parse(data)
    }
  }

  write(obj: T): Promise<void> {
    return this.#adapter.write(this.#stringify(obj))
  }
}

export class DataFileSync<T> implements SyncAdapter<T> {
  #adapter: TextFileSync
  #parse: (str: string) => T
  #stringify: (data: T) => string

  constructor(
    filename: PathLike,
    {
      parse,
      stringify,
    }: {
      parse: (str: string) => T
      stringify: (data: T) => string
    },
  ) {
    this.#adapter = new TextFileSync(filename)
    this.#parse = parse
    this.#stringify = stringify
  }

  read(): T | null {
    const data = this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return this.#parse(data)
    }
  }

  write(obj: T): void {
    this.#adapter.write(this.#stringify(obj))
  }
}

export class JSONFile<T> extends DataFile<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data: T) => JSON.stringify(data, null, 2),
    })
  }
}

export class JSONFileSync<T> extends DataFileSync<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data: T) => JSON.stringify(data, null, 2),
    })
  }
}
