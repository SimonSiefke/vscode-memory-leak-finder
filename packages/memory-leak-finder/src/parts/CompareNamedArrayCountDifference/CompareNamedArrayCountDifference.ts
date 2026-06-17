import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareItem = (a: { count: number }, b: { count: number }): number => {
  return b.count - a.count
}

const sortByCounts = (items: readonly { count: number; name: string; delta: number; [key: string]: unknown }[]): readonly { count: number; name: string; delta: number; [key: string]: unknown }[] => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

export const compareNamedArrayCountDifference = (before: unknown, after: unknown): readonly { count: number; name: string; delta: number; [key: string]: unknown }[] => {
  Assert.array(before)
  Assert.array(after)
  const beforeMap: { [name: string]: number } = Object.create(null)
  for (const item of before as readonly { name: string; count: number }[]) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const leaked: { count: number; name: string; delta: number; [key: string]: unknown }[] = []
  for (const item of after as readonly { name: string; count: number; [key: string]: unknown }[]) {
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
