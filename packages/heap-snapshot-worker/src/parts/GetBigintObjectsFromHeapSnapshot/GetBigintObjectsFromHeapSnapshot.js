import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getBigintObjectsFromHeapSnapshotInternal } from '../GetBigintObjectsFromHeapSnapshotInternal/GetBigintObjectsFromHeapSnapshotInternal.js'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getBigintObjectsFromHeapSnapshot = async (pathUri) => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })

  const { nodes, strings, edges, metaData } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta

  return getBigintObjectsFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields)
}
