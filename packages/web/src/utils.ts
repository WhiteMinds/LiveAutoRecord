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
