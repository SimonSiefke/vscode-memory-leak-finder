import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getMapObjectsFromHeapSnapshotInternal } from '../GetMapObjectsFromHeapSnapshotInternal/GetMapObjectsFromHeapSnapshotInternal.js'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getMapObjectsFromHeapSnapshot = async (pathUri) => {
  // Use fast prepareHeapSnapshot with string parsing
  const { metaData, nodes, edges, strings } = await prepareHeapSnapshot(pathUri, { parseStrings: true })
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta
  return getMapObjectsFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields)
}
