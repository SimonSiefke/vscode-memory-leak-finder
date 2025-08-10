import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getWeakMapCountFromHeapSnapshotInternal } from '../GetWeakMapCountFromHeapSnapshotInternal/GetWeakMapCountFromHeapSnapshotInternal.js'

/**
 * @param pathUri
 * @returns Promise<Array>
 */
export const getWeakMapCountFromHeapSnapshot = async (pathUri: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })
  return getWeakMapCountFromHeapSnapshotInternal(snapshot)
}
