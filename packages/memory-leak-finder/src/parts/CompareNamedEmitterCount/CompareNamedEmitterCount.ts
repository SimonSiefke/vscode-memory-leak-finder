import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareItem = (a: { count: number; name: string }, b: { count: number; name: string }): number => {
  return b.count - a.count || a.name.localeCompare(b.name)
}

const sortByCounts = (items: readonly { count: number; delta: number; name: string }[]): readonly { count: number; delta: number; name: string }[] => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}

export const compareNamedEmitterCount = (before: unknown, after: unknown): readonly { count: number; delta: number; name: string }[] => {
  const beforeMap: { [name: string]: number } = Object.create(null)
  for (const item of before as readonly { name: string; count: number }[]) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const result: { count: number; delta: number; name: string }[] = []
  for (const item of after as readonly { name: string; count: number }[]) {
    const beforeCount = beforeMap[item.name] || 0
    const afterCount = item.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      result.push({
        count: afterCount,
        delta,
        name: item.name,
      })
    }
  }
  const sorted = sortByCounts(result)
  return sorted
}
