import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import type { CountItem } from '../Snapshot/Snapshot.ts'

const compareItem = (a: CountItem, b: CountItem): number => {
  return b.count - a.count
}

export const sortCountMap = <T extends CountItem>(items: readonly T[]): readonly T[] => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
