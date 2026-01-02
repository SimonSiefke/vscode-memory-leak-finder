import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import * as Assert from '../Assert/Assert.ts'

interface LeakedString {
  readonly string: string
  readonly delta: number
}

const compareCount = (a: LeakedString, b: LeakedString): number => {
  return b.delta - a.delta
}

const getLeakedStrings = (before: readonly string[], after: readonly string[], minCount: number): readonly LeakedString[] => {
  const countMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    countMap[item] ||= 0
    countMap[item]++
  }
  for (const item of after) {
    countMap[item] ||= 0
    countMap[item]--
  }
  const leaked: LeakedString[] = []
  for (const [key, value] of Object.entries(countMap)) {
    if (value < 0 && -value >= minCount) {
      leaked.push({
        string: key,
        delta: -value,
      })
    }
  }
  const sorted = leaked.toSorted(compareCount)
  return sorted
}

export const compareStrings2 = async (beforePath: string, afterPath: string, minCount: number): Promise<readonly LeakedString[]> => {
  Assert.string(beforePath)
  Assert.string(afterPath)
  Assert.number(minCount)
  const [snapshotBefore, snapshotAfter] = await Promise.all([
    prepareHeapSnapshot(beforePath, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(afterPath, {
      parseStrings: true,
    }),
  ])
  const leaked = getLeakedStrings(snapshotBefore.strings, snapshotAfter.strings, minCount)
  return leaked
}
