import { getWeakRefCountFromHeapSnapshotInternal } from '../GetWeakRefCountFromHeapSnapshotInternal/GetWeakRefCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWeakRefCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakRefCountFromHeapSnapshotInternal(snapshot)
}
