import * as R from 'ramda'

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

export function valuesToMapWithKVEqual<Values extends string>(
  values: Values[]
): {
  [V in Values]: V
} {
  const kvList = values.map((v) => ({
    [v]: v,
  }))
  return Object.assign({}, ...kvList)
}

export function isPromiseLike<T>(obj: unknown): obj is PromiseLike<T> {
  return (
    !!obj && typeof obj === 'object' && typeof (obj as any).then === 'function'
  )
}

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg)
  }
}

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(
  fn: Fn
): Fn {
  let latestPromise: Promise<unknown> | null = null

  return function (this: unknown, ...args) {
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
