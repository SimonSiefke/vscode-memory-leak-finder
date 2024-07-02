import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareEventTargets from '../CompareEventTargets/CompareEventTargets.js'

const compareCount = (a, b) => {
  return b.count - a.count
}

const compareDescription = (a, b) => {
  const aDescription = a.description || ''
  const bDescription = b.description || ''
  return aDescription.localeCompare(bDescription)
}
const compareEventTarget = (a, b) => {
  return compareCount(a, b) || compareDescription(a, b)
}

const sort = (eventTargets) => {
  return Arrays.toSorted(eventTargets, compareEventTarget)
}

export const compareEventTargets = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const pretty = CompareEventTargets.compareEventTargets(before, after)
  const beforeMap = Object.create(null)
  for (const item of pretty.before) {
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
        ...item,
        delta,
      })
    }
  }
  const sorted = sort(leaked)
  return sorted
}
