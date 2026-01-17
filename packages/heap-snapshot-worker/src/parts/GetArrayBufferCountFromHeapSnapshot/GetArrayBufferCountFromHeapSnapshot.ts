import { getArrayBufferCountFromHeapSnapshotInternal } from '../GetArrayBufferCountFromHeapSnapshotInternal/GetArrayBufferCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getArrayBufferCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getArrayBufferCountFromHeapSnapshotInternal(snapshot)
}
