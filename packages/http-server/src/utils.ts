import fs from 'fs'
import path from 'path'
import * as R from 'ramda'
import { debounce, throttle } from 'lodash'

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg)
  }
}

export function assertStringType(
  data: unknown,
  msg?: string
): asserts data is string {
  assert(typeof data === 'string', msg)
}

export function assertNumberType(
  data: unknown,
  msg?: string
): asserts data is number {
  assert(typeof data === 'number', msg)
}

export function assertObjectType(
  data: unknown,
  msg?: string
): asserts data is object {
  assert(typeof data === 'object', msg)
}

export function pick<T extends Record<string, any>, U extends keyof T>(
  object: T,
  ...props: U[]
): Pick<T, Exclude<keyof T, Exclude<keyof T, U>>> {
  return R.pick(props, object)
}

export function omit<
  T extends Record<string, any>,
  U extends Exclude<keyof T, number | symbol>
>(object: T, ...props: U[]): Omit<T, U> {
  return R.omit(props, object)
}

export async function readJSONFile<T = unknown>(
  filePath: string,
  defaultValue: T
): Promise<T> {
  if (!fs.existsSync(filePath)) return defaultValue

  const buffer = await fs.promises.readFile(filePath)
  return JSON.parse(buffer.toString('utf8')) as T
}

export async function writeJSONFile<T = unknown>(
  filePath: string,
  json: T
): Promise<void> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, JSON.stringify(json))
}

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(
  fn: Fn
): Fn {
  let latestPromise: Promise<unknown> | null = null

  return function (...args) {
    if (latestPromise) return latestPromise

    const promise = fn.apply(this, args)
    promise.finally(() => {
      if (promise === latestPromise) {
        latestPromise = null
      }
    })

    latestPromise = promise
    return promise
  } as Fn
}

/**
 * 在 fn 到达等待时间开始执行的过程中，再次执行 fn，第二次执行将会被推迟到第一次 fn 执行完成后的新一轮 debounce。
 * TODO: 感觉这里泛型的场景比较少，暂时先不写。
 */
export function asyncDebounce(
  fn: () => Promise<void>,
  time: number
): () => void {
  let hasDeferred = false
  let running = false

  async function _fn() {
    if (running) {
      hasDeferred = true
      return
    }
    running = true
    await fn.call(this)
    running = false
    if (hasDeferred) {
      hasDeferred = false
      debounced()
    }
  }

  const debounced = debounce(_fn, time)

  return debounced
}

export function asyncThrottle(
  fn: () => Promise<void>,
  time: number
): () => void {
  let savingPromise: Promise<void> | null = null
  let hasDeferred = false

  const throttled = throttle(() => {
    if (savingPromise != null) {
      hasDeferred = true
      return
    }

    savingPromise = fn().finally(() => {
      savingPromise = null
      if (hasDeferred) {
        throttled()
      }
    })
  }, time)

  return throttled
}
