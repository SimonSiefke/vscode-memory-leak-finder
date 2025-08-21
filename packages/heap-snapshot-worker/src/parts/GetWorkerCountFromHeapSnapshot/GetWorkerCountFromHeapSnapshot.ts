import { getWorkerCountFromHeapSnapshotInternal } from '../GetWorkerCountFromHeapSnapshotInternal/GetWorkerCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWorkerCountFromHeapSnapshot = async (path: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWorkerCountFromHeapSnapshotInternal(snapshot)
}
