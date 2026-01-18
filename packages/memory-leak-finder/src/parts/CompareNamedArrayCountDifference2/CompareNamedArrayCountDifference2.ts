import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const compareNamedArrayCountDifference2 = async (beforePath: string, afterPath: string) => {
  await using rpc = await launchHeapSnapshotWorker()
  const result = await rpc.invoke('HeapSnapshot.compareArrays2', beforePath, afterPath)
  return result
}
