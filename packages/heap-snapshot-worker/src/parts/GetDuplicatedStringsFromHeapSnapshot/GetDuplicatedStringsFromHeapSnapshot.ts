import { getDuplicatedStringsFromHeapSnapshotInternal } from '../GetDuplicatedStringsFromHeapSnapshotInternal/GetDuplicatedStringsFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getDuplicatedStringsFromHeapSnapshot = async (path: string): Promise<readonly string[]> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getDuplicatedStringsFromHeapSnapshotInternal(snapshot)
}
