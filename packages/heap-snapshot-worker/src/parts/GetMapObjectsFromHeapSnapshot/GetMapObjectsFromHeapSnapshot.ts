import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { getMapObjectsFromHeapSnapshotInternal } from '../GetMapObjectsFromHeapSnapshotInternal/GetMapObjectsFromHeapSnapshotInternal.ts'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getMapObjectsFromHeapSnapshot = async (pathUri) => {
  // Use fast prepareHeapSnapshot with string parsing
  const snapshot = await prepareHeapSnapshot(pathUri, { parseStrings: true })
  return getMapObjectsFromHeapSnapshotInternal(snapshot)
}
