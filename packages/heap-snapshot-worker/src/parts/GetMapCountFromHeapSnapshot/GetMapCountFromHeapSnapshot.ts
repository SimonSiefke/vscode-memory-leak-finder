import { getMapCountFromHeapSnapshotInternal } from '../GetMapCountFromHeapSnapshotInternal/GetMapCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMapCountFromHeapSnapshotInternal(snapshot)
}
