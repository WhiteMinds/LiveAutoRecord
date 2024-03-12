/**
 * 目前考虑到一些因素，暂时不打算上 esm，而 lowdb 1.x 以上就是纯 esm 了，所以这里只能先复制
 * 一些代码来用。
 * from https://github.com/typicode/lowdb/tree/v3.0.0
 */
import { Adapter } from '@autorecord/shared'

export * from '@autorecord/shared'

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

export class MissingAdapterError extends Error {
  constructor() {
    super()
    this.message = 'Missing Adapter'
  }
}
