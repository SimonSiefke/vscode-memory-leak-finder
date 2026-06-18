import { getWeakMapCountFromHeapSnapshotInternal } from '../GetWeakMapCountFromHeapSnapshotInternal/GetWeakMapCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWeakMapCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakMapCountFromHeapSnapshotInternal(snapshot)
}
