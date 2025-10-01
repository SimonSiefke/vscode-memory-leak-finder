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
  console.log(`[HeapSnapshotWorker] compareHeapSnapshotFunctions2 called for ${pathA} vs ${pathB}`)
  const startTime = performance.now()

  console.log(`[HeapSnapshotWorker] Preparing heap snapshots in parallel`)
  const prepareTime = performance.now()
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  console.log(`[HeapSnapshotWorker] Heap snapshots prepared in ${(performance.now() - prepareTime).toFixed(2)}ms`)

  console.log(`[HeapSnapshotWorker] Starting internal comparison`)
  const compareTime = performance.now()
  const result = await compareHeapSnapshotFunctionsInternal2(snapshotA, snapshotB, options)
  console.log(`[HeapSnapshotWorker] Internal comparison completed in ${(performance.now() - compareTime).toFixed(2)}ms`)

  const totalTime = performance.now() - startTime
  console.log(`[HeapSnapshotWorker] compareHeapSnapshotFunctions2 completed in ${totalTime.toFixed(2)}ms, found ${result.length} results`)
  return result
}
