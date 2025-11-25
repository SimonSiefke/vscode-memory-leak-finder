import { compareHeapsnapshotArraysInternal2 } from '../CompareHeapsnapshotArraysInternal2/CompareHeapsnapshotArraysInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareHeapsnapshotArrays2 = async (pathA: string, pathB: string) => {
  console.time('parse')
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  console.timeEnd('parse')

  return compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
}
