import { getFunctionCountFromHeapSnapshotInternal } from '../GetFunctionCountFromHeapSnapshotInternal/GetFunctionCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getFunctionCountFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getFunctionCountFromHeapSnapshotInternal(snapshot)
}
