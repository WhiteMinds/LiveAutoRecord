import { DebouncedFunc, throttle } from 'lodash'

export type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>

export function asyncThrottle(
  fn: () => Promise<void>,
  time: number,
  opts: {
    immediateRunWhenEndOfDefer?: boolean
  } = {}
): DebouncedFunc<() => void> {
  let savingPromise: Promise<void> | null = null
  let hasDeferred = false

  const wrappedWithAllowDefer = () => {
    if (savingPromise != null) {
      hasDeferred = true
      return
    }

    savingPromise = fn().finally(() => {
      savingPromise = null
      if (hasDeferred) {
        if (opts.immediateRunWhenEndOfDefer) {
          wrappedWithAllowDefer()
        } else {
          throttled()
        }
      }
    })
  }

  const throttled = throttle(wrappedWithAllowDefer, time)

  return throttled
}
