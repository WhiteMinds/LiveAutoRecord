import * as R from 'ramda'

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
