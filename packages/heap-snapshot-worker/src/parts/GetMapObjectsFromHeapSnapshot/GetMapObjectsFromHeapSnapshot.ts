import { getMapObjectsFromHeapSnapshotInternal } from '../GetMapObjectsFromHeapSnapshotInternal/GetMapObjectsFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getMapObjectsFromHeapSnapshot = async (pathUri: string) => {
  // Use fast prepareHeapSnapshot with string parsing
  const snapshot = await prepareHeapSnapshot(pathUri, { parseStrings: true })
  return getMapObjectsFromHeapSnapshotInternal(snapshot)
}
