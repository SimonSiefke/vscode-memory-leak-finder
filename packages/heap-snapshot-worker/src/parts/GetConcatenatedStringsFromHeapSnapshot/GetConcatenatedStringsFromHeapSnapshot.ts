import { getConcatenatedStringsFromHeapSnapshotInternal } from '../GetConcatenatedStringsFromHeapSnapshotInternal/GetConcatenatedStringsFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getConcatenatedStringsFromHeapSnapshot = async (path: string): Promise<readonly string[]> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getConcatenatedStringsFromHeapSnapshotInternal(snapshot)
}
