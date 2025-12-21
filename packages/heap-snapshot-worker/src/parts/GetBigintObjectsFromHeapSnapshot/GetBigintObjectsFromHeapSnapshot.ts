import { getBigintObjectsFromHeapSnapshotInternal } from '../GetBigintObjectsFromHeapSnapshotInternal/GetBigintObjectsFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

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
