export const compareMapLeak = <T extends { objectId?: unknown; [key: string]: unknown }>(before: readonly T[], after: readonly T[], getKey: (element: T) => string): Omit<T, 'objectId'>[] => {
  const map: { [key: string]: number } = Object.create(null)
  for (const element of before) {
    const key = getKey(element)
    map[key] ||= 0
    map[key]++
  }
  const leaked: Omit<T, 'objectId'>[] = []
  for (const element of after) {
    const key = getKey(element)
    if (map[key]) {
      map[key]--
    } else {
      const { objectId, ...rest } = element
      leaked.push(rest)
    }
  }
  return leaked
}
