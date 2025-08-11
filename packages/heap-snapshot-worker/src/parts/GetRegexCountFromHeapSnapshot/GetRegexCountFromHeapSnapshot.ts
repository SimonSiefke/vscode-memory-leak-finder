import { getRegexCountFromHeapSnapshotInternal } from '../GetRegexCountFromHeapSnapshotInternal/GetRegexCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getRegexCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getRegexCountFromHeapSnapshotInternal(snapshot)
}
