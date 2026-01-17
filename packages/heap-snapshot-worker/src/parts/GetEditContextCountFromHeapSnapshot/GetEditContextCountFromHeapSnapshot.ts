import { getEditContextCountFromHeapSnapshotInternal } from '../GetEditContextCountFromHeapSnapshotInternal/GetEditContextCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getEditContextCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getEditContextCountFromHeapSnapshotInternal(snapshot)
}
