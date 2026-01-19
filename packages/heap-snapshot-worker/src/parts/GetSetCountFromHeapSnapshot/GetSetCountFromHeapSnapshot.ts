import { getSetCountFromHeapSnapshotInternal } from '../GetSetCountFromHeapSnapshotInternal/GetSetCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getSetCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getSetCountFromHeapSnapshotInternal(snapshot)
}
