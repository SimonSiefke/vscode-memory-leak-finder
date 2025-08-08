import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getArraysFromHeapSnapshotInternal } from '../GetArraysFromHeapSnapshotInternal/GetArraysFromHeapSnapshotInternal.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

export const getArraysFromHeapSnapshot = async (pathUri) => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })

  const { nodes, strings, edges, metaData } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta

  // Also get parsed nodes and graph for name mapping
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot({ nodes, strings, edges, snapshot: metaData.data })

  return getArraysFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph)
}
