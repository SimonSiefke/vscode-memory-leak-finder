import { getMapCountFromHeapSnapshotInternal } from '../GetMapCountFromHeapSnapshotInternal/GetMapCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMapCountFromHeapSnapshotInternal(snapshot)
}
