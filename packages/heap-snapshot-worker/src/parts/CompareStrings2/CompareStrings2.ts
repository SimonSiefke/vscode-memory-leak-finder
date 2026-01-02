import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import * as Assert from '../Assert/Assert.ts'

const getLeakedStrings = (before: readonly string[], after: readonly string[], minCount: number): readonly string[] => {
  const countMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    countMap[item] ||= 0
    countMap[item]++
  }
  for (const item of after) {
    countMap[item] ||= 0
    countMap[item]--
  }
  const leaked: string[] = []
  for (const [key, value] of Object.entries(countMap)) {
    if (value < 0) {
      leaked.push(key)
    }
  }
  return leaked
}

export const compareStrings2 = async (beforePath: string, afterPath: string, minCount: number): Promise<readonly string[]> => {
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
