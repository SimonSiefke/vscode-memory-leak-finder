import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareItem = (a, b) => {
  return b.count - a.count || a.name.localeCompare(b.name)
}

const sortByCounts = (items) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

export const compareNamedEmitterCount = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const result = []
  for (const item of after) {
    const beforeCount = beforeMap[item.name] || 0
    const afterCount = item.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      result.push({
        name: item.name,
        count: afterCount,
        delta,
      })
    }
  }
  const sorted = sortByCounts(result)
  return sorted
}
