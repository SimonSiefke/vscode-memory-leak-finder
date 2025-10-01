import {
  compareHeapSnapshotFunctionsInternal2,
  type CompareResult,
  type CompareFunctionsOptions,
} from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareHeapSnapshotFunctions2 = async (
  pathA: string,
  pathB: string,
  options: CompareFunctionsOptions,
): Promise<readonly CompareResult[]> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  console.time('compare')
  const result = await compareHeapSnapshotFunctionsInternal2(snapshotA, snapshotB, options)
  console.timeEnd('compare')
  return result
}
