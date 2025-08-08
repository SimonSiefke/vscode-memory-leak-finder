import { getEditContextCountFromHeapSnapshotInternal } from '../GetEditContextCountFromHeapSnapshotInternal/GetEditContextCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getEditContextCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getEditContextCountFromHeapSnapshotInternal(snapshot)
}
