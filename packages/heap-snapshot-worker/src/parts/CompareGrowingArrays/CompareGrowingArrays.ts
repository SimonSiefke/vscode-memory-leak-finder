import { compareGrowingArraysInternal } from '../CompareGrowingArraysInternal/CompareGrowingArraysInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareGrowingArrays = async (pathA: string, pathB: string, options?: any): Promise<{ aCount: number; bCount: number }> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  return compareGrowingArraysInternal(snapshotA, snapshotB)
}
