import { getBigintObjectsFromHeapSnapshotInternal } from '../GetBigintObjectsFromHeapSnapshotInternal/GetBigintObjectsFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getBigintObjectsFromHeapSnapshot = async (pathUri) => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })
  return getBigintObjectsFromHeapSnapshotInternal(snapshot)
}
