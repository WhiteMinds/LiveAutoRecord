/**
 * express-sse 没有类型声明，所以直接复制过来改了。
 * from https://github.com/dpskvn/express-sse/blob/master/index.js
 *
 * 它的实现比较简单，不支持断线后通过 lastEventId 重连，不过也满足目前使用了。
 */

import { EventEmitter } from 'events'
import { Request, Response } from 'express'

interface Options {
  isSerialized: boolean
  isCompressed?: boolean
  initialEvent?: string
}

/**
 * Server-Sent Event instance class
 */
export class SSE extends EventEmitter {
  initial: string[]

  /**
   * Creates a new Server-Sent Event instance
   * @param initial Initial value(s) to be served through SSE
   * @param options SSE options
   */
  constructor(
    initial: any | any[] = [],
    public options: Options = { isSerialized: true }
  ) {
    super()

    this.initial = Array.isArray(initial) ? initial : [initial]
  }

  /**
   * The SSE route handler
   */
  init = (req: Request, res: Response) => {
    let id = 0
    req.socket.setTimeout(0)
    req.socket.setNoDelay(true)
    req.socket.setKeepAlive(true)
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    if (req.httpVersion !== '2.0') {
      res.setHeader('Connection', 'keep-alive')
    }
    if (this.options.isCompressed) {
      res.setHeader('Content-Encoding', 'deflate')
    }

    // Increase number of event listeners on init
    this.setMaxListeners(this.getMaxListeners() + 2)

    const dataListener = (data: any) => {
      if (data.id) {
        res.write(`id: ${data.id}\n`)
      } else {
        res.write(`id: ${id}\n`)
        id += 1
      }
      if (data.event) {
        res.write(`event: ${data.event}\n`)
      }
      res.write(`data: ${JSON.stringify(data.data)}\n\n`)
      res.flushHeaders()
    }

    const serializeListener = (data: any) => {
      const serializeSend = data.reduce((all, msg) => {
        all += `id: ${id}\ndata: ${JSON.stringify(msg)}\n\n`
        id += 1
        return all
      }, '')
      res.write(serializeSend)
    }

    this.on('data', dataListener)

    this.on('serialize', serializeListener)

    if (this.initial) {
      if (this.options.isSerialized) {
        this.serialize(this.initial)
      } else if (this.initial.length > 0) {
        this.send(this.initial, this.options.initialEvent)
      }
    }

    // Remove listeners and reduce the number of max listeners on client disconnect
    req.on('close', () => {
      this.removeListener('data', dataListener)
      this.removeListener('serialize', serializeListener)
      this.setMaxListeners(this.getMaxListeners() - 2)
    })
  }

  /**
   * Update the data initially served by the SSE stream
   * @param data array containing data to be served on new connections
   */
  updateInit(data: any | any[]) {
    this.initial = Array.isArray(data) ? data : [data]
  }

  /**
   * Empty the data initially served by the SSE stream
   */
  dropInit() {
    this.initial = []
  }

  /**
   * Send data to the SSE
   * @param {(object|string)} data Data to send into the stream
   * @param event Event name
   * @param id Custom event ID
   */
  send(data: any, event?: string, id?: string | number) {
    this.emit('data', { data, event, id })
  }

  /**
   * Send serialized data to the SSE
   * @param data Data to be serialized as a series of events
   */
  serialize(data: any | any[]) {
    if (Array.isArray(data)) {
      this.emit('serialize', data)
    } else {
      this.send(data)
    }
  }
}
