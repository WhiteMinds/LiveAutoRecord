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
