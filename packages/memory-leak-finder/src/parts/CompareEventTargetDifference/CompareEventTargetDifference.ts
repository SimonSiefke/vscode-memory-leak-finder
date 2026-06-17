import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CompareEventTargets from '../CompareEventTargets/CompareEventTargets.ts'

const compareCount = (a: { count: number }, b: { count: number }): number => {
  return b.count - a.count
}

const compareDescription = (a: { description?: string }, b: { description?: string }): number => {
  const aDescription = a.description || ''
  const bDescription = b.description || ''
  return aDescription.localeCompare(bDescription)
}
const compareEventTarget = (a: { count: number; description?: string }, b: { count: number; description?: string }): number => {
  return compareCount(a, b) || compareDescription(a, b)
}

const sort = (eventTargets: readonly { count: number; description?: string; delta: number }[]): readonly { count: number; description?: string; delta: number }[] => {
  return Arrays.toSorted(eventTargets, compareEventTarget)
}

export const compareEventTargets = (before: unknown, after: unknown): readonly { count: number; description?: string; delta: number }[] => {
  Assert.array(before)
  Assert.array(after)
  const pretty = CompareEventTargets.compareEventTargets(before, after)
  const beforeMap = Object.create(null)
  for (const item of pretty.before) {
    beforeMap[item.description] ||= 0
    beforeMap[item.description] += item.count
  }
  const leaked: { count: number; description?: string; delta: number }[] = []
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
