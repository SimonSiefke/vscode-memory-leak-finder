import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedArrayCountDifference2 = async (beforePath, afterPath) => {
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareArrays2', beforePath, afterPath)
  return result
}
