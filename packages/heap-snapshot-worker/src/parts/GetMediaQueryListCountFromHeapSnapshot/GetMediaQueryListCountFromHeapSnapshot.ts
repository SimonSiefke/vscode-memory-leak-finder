import { getMediaQueryListCountFromHeapSnapshotInternal } from '../GetMediaQueryListCountFromHeapSnapshotInternal/GetMediaQueryListCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getMediaQueryListCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMediaQueryListCountFromHeapSnapshotInternal(snapshot)
}
