import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareItem = (a, b) => {
  return b.count - a.count
}

const sortByCounts = (items) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

const mergeItems = (beforeMap, afterMap) => {
  const leaked = []
  for (const [name, afterCount] of Object.entries(afterMap)) {
    const beforeCount = beforeMap[name] || 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        name,
        count: afterCount,
        delta,
      })
    }
  }
  return leaked
}

export const compareNamedArrayCountDifference = (before, after) => {
  const leaked = mergeItems(before, after)
  const sorted = sortByCounts(leaked)
  return sorted
}
