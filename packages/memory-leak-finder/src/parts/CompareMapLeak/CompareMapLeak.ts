import type { Dynamic } from '../Types/Types.ts'
export const compareMapLeak = (before: Dynamic, after: Dynamic, getKey: Dynamic) => {
  const map = Object.create(null)
  for (const element of before) {
    const key = getKey(element)
    map[key] ||= 0
    map[key]++
  }
  const leaked: Dynamic[] = []
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
