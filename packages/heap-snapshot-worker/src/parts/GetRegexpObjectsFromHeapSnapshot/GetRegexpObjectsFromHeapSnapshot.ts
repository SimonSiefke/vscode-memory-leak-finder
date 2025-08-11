import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { getRegexpObjectsFromHeapSnapshotInternal } from '../GetRegexpObjectsFromHeapSnapshotInternal/GetRegexpObjectsFromHeapSnapshotInternal.ts'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })
  return getRegexpObjectsFromHeapSnapshotInternal(snapshot)
}
