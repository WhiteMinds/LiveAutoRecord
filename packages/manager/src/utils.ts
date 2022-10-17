import { throttle } from 'lodash'

export type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>

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
