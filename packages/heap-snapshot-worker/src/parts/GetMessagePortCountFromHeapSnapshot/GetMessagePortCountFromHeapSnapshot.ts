import { getMessagePortCountFromHeapSnapshotInternal } from '../GetMessagePortCountFromHeapSnapshotInternal/GetMessagePortCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getMessagePortCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMessagePortCountFromHeapSnapshotInternal(snapshot)
}
