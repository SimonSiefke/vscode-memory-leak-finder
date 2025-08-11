import { getRegexCountFromHeapSnapshotInternal } from '../GetRegexCountFromHeapSnapshotInternal/GetRegexCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getRegexCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getRegexCountFromHeapSnapshotInternal(snapshot)
}
