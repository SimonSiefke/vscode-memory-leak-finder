import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getRegexpObjectsFromHeapSnapshotInternal } from '../GetRegexpObjectsFromHeapSnapshotInternal/GetRegexpObjectsFromHeapSnapshotInternal.js'

/**
 * @param pathUri
 * @returns Promise<Array>
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri: string): Promise<any[]> => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })
  return getRegexpObjectsFromHeapSnapshotInternal(snapshot)
}
