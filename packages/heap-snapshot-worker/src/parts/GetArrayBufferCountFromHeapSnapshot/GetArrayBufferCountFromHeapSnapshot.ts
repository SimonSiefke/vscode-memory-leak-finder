import { getArrayBufferCountFromHeapSnapshotInternal } from '../GetArrayBufferCountFromHeapSnapshotInternal/GetArrayBufferCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getArrayBufferCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getArrayBufferCountFromHeapSnapshotInternal(snapshot)
}
