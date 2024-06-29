import * as ParseHeapSnapshotInternal from '../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js'

export const parseHeapSnapshot = (heapsnapshot) => {
  const { snapshot, nodes, edges, strings } = heapsnapshot
  const { meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta
  return ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, node_fields, node_types, edges, edge_fields, edge_types, strings)
}
