import { getWeakMapCountFromHeapSnapshotInternal } from '../GetWeakMapCountFromHeapSnapshotInternal/GetWeakMapCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getWeakMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakMapCountFromHeapSnapshotInternal(snapshot)
}
