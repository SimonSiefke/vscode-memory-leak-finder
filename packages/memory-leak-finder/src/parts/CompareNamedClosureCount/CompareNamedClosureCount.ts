import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
const compareItem = (a: Dynamic, b: Dynamic) => {
  return b.contextNodeCount - a.contextNodeCount
}
const sortByCounts = (items: Dynamic) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
export const compareNamedClosureCount = (before: Dynamic, after: Dynamic) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.contextNodeCount + 1
  }
  const afterMap = Object.create(null)
  for (const item of after) {
    afterMap[item.name] ||= 0
    afterMap[item.name] += item.contextNodeCount + 1
  }
  const result: Dynamic[] = []
  for (const [key, value] of Object.entries(afterMap)) {
    const beforeCount = beforeMap[key] || 0
    const afterCount = value
    const delta = Number(afterCount) - Number(beforeCount)
    if (!delta || delta < 0) {
      continue
    }
    result.push({
      contextNodeCount: afterCount,
      delta,
      name: key,
    })
  }
  const sorted = sortByCounts(result)
  return sorted
}
