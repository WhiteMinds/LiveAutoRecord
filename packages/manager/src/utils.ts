export type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>
