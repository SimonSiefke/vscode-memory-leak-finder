import { getNamedMapCountFromHeapSnapshotInternal } from '../GetNamedMapCountFromHeapSnapshotInternal/GetNamedMapCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getNamedMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getNamedMapCountFromHeapSnapshotInternal(snapshot)
}
