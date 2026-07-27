import { getConcatenatedErrorStringCountsFromHeapSnapshotInternal } from '../GetConcatenatedErrorStringCountsFromHeapSnapshotInternal/GetConcatenatedErrorStringCountsFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getConcatenatedErrorStringCountsFromHeapSnapshot = async (path: string) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getConcatenatedErrorStringCountsFromHeapSnapshotInternal(snapshot)
}
