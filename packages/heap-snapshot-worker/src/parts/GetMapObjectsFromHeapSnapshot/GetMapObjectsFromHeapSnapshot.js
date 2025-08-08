import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getMapObjectsFromHeapSnapshotInternal } from '../GetMapObjectsFromHeapSnapshotInternal/GetMapObjectsFromHeapSnapshotInternal.js'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getMapObjectsFromHeapSnapshot = async (pathUri) => {
  // Use fast prepareHeapSnapshot with string parsing
  const snapshot = await prepareHeapSnapshot(pathUri, { parseStrings: true })
  return getMapObjectsFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields)
}
