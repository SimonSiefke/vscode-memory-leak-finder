import {
  compareHeapSnapshotFunctionsInternal2,
  type CompareResult,
} from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareHeapSnapshotFunctions2 = async (pathA: string, pathB: string): Promise<readonly CompareResult[]> => {
  const [snapshotA, snapshotB] = await Promise.all([prepareHeapSnapshot(pathA, {}), prepareHeapSnapshot(pathB, {})])
  console.time('compare')
  const result = compareHeapSnapshotFunctionsInternal2(snapshotA, snapshotB)
  console.timeEnd('compare')
  return result
}
