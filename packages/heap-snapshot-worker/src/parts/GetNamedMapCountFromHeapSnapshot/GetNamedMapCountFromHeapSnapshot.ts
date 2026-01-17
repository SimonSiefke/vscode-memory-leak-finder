import { getNamedMapCountFromHeapSnapshotInternal } from '../GetNamedMapCountFromHeapSnapshotInternal/GetNamedMapCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getNamedMapCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getNamedMapCountFromHeapSnapshotInternal(snapshot)
}
