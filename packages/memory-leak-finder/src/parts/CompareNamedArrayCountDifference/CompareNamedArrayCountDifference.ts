import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
const compareItem = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count
}
const sortByCounts = (items: Dynamic) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
export const compareNamedArrayCountDifference = (before: Dynamic, after: Dynamic) => {
  Assert.array(before)
  Assert.array(after)
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const leaked: Dynamic[] = []
  for (const item of after) {
    const oldCount = beforeMap[item.name] || 0
    const afterCount = item.count
    const delta = afterCount - oldCount
    if (delta > 0) {
      leaked.push({
        ...item,
        delta,
      })
    }
  }
  const sorted = sortByCounts(leaked)
  return sorted
}
