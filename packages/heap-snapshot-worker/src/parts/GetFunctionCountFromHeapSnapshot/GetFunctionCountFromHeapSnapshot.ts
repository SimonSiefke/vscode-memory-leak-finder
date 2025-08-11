import { getFunctionCountFromHeapSnapshotInternal } from '../GetFunctionCountFromHeapSnapshotInternal/GetFunctionCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getFunctionCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getFunctionCountFromHeapSnapshotInternal(snapshot)
}
