import { getPromiseCountFromHeapSnapshotInternal } from '../GetPromiseCountFromHeapSnapshotInternal/GetPromiseCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getPromiseCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getPromiseCountFromHeapSnapshotInternal(snapshot)
}
