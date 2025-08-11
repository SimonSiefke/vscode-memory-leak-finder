import { getMediaQueryListCountFromHeapSnapshotInternal } from '../GetMediaQueryListCountFromHeapSnapshotInternal/GetMediaQueryListCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getMediaQueryListCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMediaQueryListCountFromHeapSnapshotInternal(snapshot)
}
