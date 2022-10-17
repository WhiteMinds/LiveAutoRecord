/**
 * 目前考虑到一些因素，暂时不打算上 esm，而 lowdb 1.x 以上就是纯 esm 了，所以这里只能先复制
 * 一些代码来用。
 * from https://github.com/typicode/lowdb/tree/v3.0.0
 */
import fs from 'fs'
import { Writer } from 'steno'

export interface Adapter<T> {
  read: () => Promise<T | null>
  write: (data: T) => Promise<void>
}

export class Low<T = unknown> {
  adapter: Adapter<T>
  data: T | null = null

  constructor(adapter: Adapter<T>) {
    if (adapter) {
      this.adapter = adapter
    } else {
      throw new MissingAdapterError()
    }
  }

  async read(): Promise<void> {
    this.data = await this.adapter.read()
  }

  async write(): Promise<void> {
    if (this.data) {
      await this.adapter.write(this.data)
    }
  }
}

export class JSONFile<T> implements Adapter<T> {
  #adapter: TextFile

  constructor(filename: string) {
    this.#adapter = new TextFile(filename)
  }

  async read(): Promise<T | null> {
    const data = await this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return JSON.parse(data) as T
    }
  }

  write(obj: T): Promise<void> {
    return this.#adapter.write(JSON.stringify(obj, null, 2))
  }
}

export class TextFile implements Adapter<string> {
  #filename: string
  #writer: Writer

  constructor(filename: string) {
    this.#filename = filename
    this.#writer = new Writer(filename)
  }

  async read(): Promise<string | null> {
    let data

    try {
      data = await fs.promises.readFile(this.#filename, 'utf-8')
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

export class MissingAdapterError extends Error {
  constructor() {
    super()
    this.message = 'Missing Adapter'
  }
}
