import { getWorkerCountFromHeapSnapshotInternal } from '../GetWorkerCountFromHeapSnapshotInternal/GetWorkerCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWorkerCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWorkerCountFromHeapSnapshotInternal(snapshot)
}
