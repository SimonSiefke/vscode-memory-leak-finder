import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import * as Assert from '../Assert/Assert.ts'
import { compareStrings2Internal, type LeakedString } from '../CompareStrings2Internal/CompareStrings2Internal.ts'

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
  const leaked = compareStrings2Internal(snapshotBefore.strings, snapshotAfter.strings, minCount)
  return leaked
}
