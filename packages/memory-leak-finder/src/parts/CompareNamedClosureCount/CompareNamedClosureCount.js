import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareItem = (a, b) => {
  return b.contextNodeCount - a.contextNodeCount
}

const sortByCounts = (items) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

export const compareNamedClosureCount = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.contextNodeCount
  }
  const afterMap = Object.create(null)
  for (const item of after) {
    afterMap[item.name] ||= 0
    afterMap[item.name] += item.contextNodeCount
  }
  const result = []
  for (const [key, value] of Object.entries(afterMap)) {
    const beforeCount = beforeMap[key] || 0
    const afterCount = value
    const delta = afterCount - beforeCount
    result.push({
      name: key,
      contextNodeCount: afterCount,
      delta,
    })
  }
  const sorted = sortByCounts(result)
  return sorted
}
