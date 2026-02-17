import type { CompareResult } from '../CompareHeapSnapshotsFunctionsInternal2/CompareResult.ts'
import {
  compareHeapSnapshotFunctionsInternal2,
  type CompareFunctionsOptions,
} from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareHeapSnapshotFunctions2 = async (
  pathA: string,
  pathB: string,
  options: CompareFunctionsOptions,
): Promise<readonly CompareResult[]> => {
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
  const result = await compareHeapSnapshotFunctionsInternal2(snapshotA, snapshotB, options)
  return result
}
