import { getArraysFromHeapSnapshotInternal } from '../GetArraysFromHeapSnapshotInternal/GetArraysFromHeapSnapshotInternal.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getArraysFromHeapSnapshot = async (pathUri: string): Promise<any> => {
  const snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })

  const { nodes, strings, edges, meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta

  // Also get parsed nodes and graph for name mapping
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot({ nodes, strings, edges, snapshot: { meta } })

  return getArraysFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph)
}
