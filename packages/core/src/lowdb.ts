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
