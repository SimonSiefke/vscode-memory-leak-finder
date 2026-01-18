import * as Assert from '../Assert/Assert.ts'
import { type LeakedString, compareStrings2Internal } from '../CompareStrings2Internal/CompareStrings2Internal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareStrings2 = async (
  beforePath: string,
  afterPath: string,
  minCount: number,
  includeChromeInternalStrings: boolean,
): Promise<readonly LeakedString[]> => {
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
  const leaked = compareStrings2Internal(snapshotBefore.strings, snapshotAfter.strings, minCount, includeChromeInternalStrings)
  return leaked
}
