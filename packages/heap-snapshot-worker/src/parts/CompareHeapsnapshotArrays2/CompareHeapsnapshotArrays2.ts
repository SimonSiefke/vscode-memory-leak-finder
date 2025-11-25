import { compareHeapsnapshotArraysInternal2 } from '../CompareHeapsnapshotArraysInternal2/CompareHeapsnapshotArraysInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareHeapsnapshotArrays2 = async (pathA: string, pathB: string) => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])

  return compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
}
