import { getWeakMapCountFromHeapSnapshotInternal } from '../GetWeakMapCountFromHeapSnapshotInternal/GetWeakMapCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWeakMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakMapCountFromHeapSnapshotInternal(snapshot)
}
