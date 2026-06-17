import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareItem = (a: { contextNodeCount: number }, b: { contextNodeCount: number }): number => {
  return b.contextNodeCount - a.contextNodeCount
}

const sortByCounts = (items: readonly { contextNodeCount: number; delta: number; name: string }[]): readonly { contextNodeCount: number; delta: number; name: string }[] => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

export const compareNamedClosureCount = (before: unknown, after: unknown): readonly { contextNodeCount: number; delta: number; name: string }[] => {
  const beforeMap: { [name: string]: number } = Object.create(null)
  for (const item of before as readonly { name: string; contextNodeCount: number }[]) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.contextNodeCount + 1
  }
  const afterMap: { [name: string]: number } = Object.create(null)
  for (const item of after as readonly { name: string; contextNodeCount: number }[]) {
    afterMap[item.name] ||= 0
    afterMap[item.name] += item.contextNodeCount + 1
  }
  const result: { contextNodeCount: number; delta: number; name: string }[] = []
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
