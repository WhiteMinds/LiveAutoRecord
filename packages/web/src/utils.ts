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

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg)
  }
}
