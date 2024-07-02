import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareEventTargets from '../CompareEventTargets/CompareEventTargets.js'

const compareEventTarget = (a, b) => {
  return b.count - a.count || a.description.localeCompare(b.description)
}

const sort = (eventTargets) => {
  return Arrays.toSorted(eventTargets, compareEventTarget)
}

export const compareEventTargets = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const pretty = CompareEventTargets.compareEventTargets(before, after)
  const beforeMap = Object.create(null)
  for (const item of before.pretty) {
    beforeMap[item.description] ||= 0
    beforeMap[item.description] += item.count
  }
  const leaked = []
  for (const item of pretty.after) {
    const beforeCount = beforeMap[item.description] || 0
    const afterCount = item.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...after,
        delta,
      })
    }
  }
  const sorted = sort(leaked)
  return sorted
}
