import { getSetCountFromHeapSnapshotInternal } from '../GetSetCountFromHeapSnapshotInternal/GetSetCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getSetCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getSetCountFromHeapSnapshotInternal(snapshot)
}
