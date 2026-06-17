import type { Dynamic } from '../Types/Types.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
export const compareNamedArrayCountDifference2 = async (beforePath: Dynamic, afterPath: Dynamic) => {
  await using rpc = await launchHeapSnapshotWorker()
  const result = await rpc.invoke('HeapSnapshot.compareArrays2', beforePath, afterPath)
  return result
}
