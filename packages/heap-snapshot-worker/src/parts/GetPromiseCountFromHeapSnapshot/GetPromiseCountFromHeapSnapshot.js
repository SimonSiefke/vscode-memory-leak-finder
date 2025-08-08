import { getPromiseCountFromHeapSnapshotInternal } from '../GetPromiseCountFromHeapSnapshotInternal/GetPromiseCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getPromiseCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getPromiseCountFromHeapSnapshotInternal(snapshot)
}
