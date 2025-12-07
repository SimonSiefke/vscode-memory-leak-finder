import { compareNamedClosureCountFromHeapSnapshotInternal2 } from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareNamedClosureCountFromHeapSnapshot2 = async (pathA: string, pathB: string): Promise<any[]> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  return compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, {})
}
