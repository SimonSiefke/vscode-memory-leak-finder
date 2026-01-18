import { getPromiseCountFromHeapSnapshotInternal } from '../GetPromiseCountFromHeapSnapshotInternal/GetPromiseCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getPromiseCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getPromiseCountFromHeapSnapshotInternal(snapshot)
}
