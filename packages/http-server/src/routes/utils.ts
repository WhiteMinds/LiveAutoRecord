import { Recorder } from '@autorecord/manager'
import { Request } from 'express'
import { omit } from '../utils'
import { ClientRecorder } from './api_types'

type PagedResultGetter<T = unknown> = (
  page: number,
  pageSize: number,
) => Promise<{
  page: number
  pageSize: number
  total: number
  totalPage: number
  items: T[]
}>

export function createPagedResultGetter<T>(
  getItems: (startIdx: number, count: number) => Promise<{ items: T[]; total: number }>,
): PagedResultGetter<T> {
  return async (page, pageSize) => {
    const start = (page - 1) * pageSize
    const { items, total } = await getItems(start, pageSize)
    return {
      page,
      pageSize,
      total,
      totalPage: Math.ceil(total / pageSize),
      items,
    }
  }
}

// TODO: 随便写的，之后找找有没有现成的库
export function getNumberFromQuery(
  req: Request,
  key: string,
  opts: {
    defaultValue: number
    min?: number
    max?: number
  },
): number
export function getNumberFromQuery(
  req: Request,
  key: string,
  opts: {
    defaultValue?: number
    min?: number
    max?: number
  },
): number | undefined
export function getNumberFromQuery(
  req: Request,
  key: string,
  opts: {
    defaultValue?: number
    min?: number
    max?: number
  } = {},
): number | undefined {
  const rawVal = req.query[key]
  const value = Number(rawVal)
  if (isNaN(value)) return opts.defaultValue
  if (opts.min != null && value < opts.min) return opts.min
  if (opts.max != null && value > opts.max) return opts.max
  return value
}

export function recorderToClient(recorder: Recorder): ClientRecorder {
  return {
    // TODO: 用 pick 更加稳健一些，这里省事先 omit 了
    ...omit(recorder, 'all', 'getChannelURL', 'checkLiveStatusAndRecord', 'recordHandle', 'toJSON'),
    channelURL: recorder.getChannelURL(),
    recordHandle: recorder.recordHandle && omit(recorder.recordHandle, 'stop'),
  }
}
