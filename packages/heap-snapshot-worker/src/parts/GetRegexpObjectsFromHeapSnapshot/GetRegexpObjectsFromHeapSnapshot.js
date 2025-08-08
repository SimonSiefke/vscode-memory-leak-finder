import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getRegexpObjectsFromHeapSnapshotInternal } from '../GetRegexpObjectsFromHeapSnapshotInternal/GetRegexpObjectsFromHeapSnapshotInternal.js'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })

  console.log({ snapshot: snapshot.snapshot })
  return getRegexpObjectsFromHeapSnapshotInternal(snapshot)
}
