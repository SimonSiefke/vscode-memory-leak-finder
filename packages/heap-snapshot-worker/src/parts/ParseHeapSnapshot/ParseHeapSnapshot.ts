import * as ParseHeapSnapshotInternal from '../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js'

export const parseHeapSnapshot = (heapsnapshot) => {
  const { snapshot, nodes, edges, strings, locations } = heapsnapshot
  const { meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields, location_fields } = meta
  return ParseHeapSnapshotInternal.parseHeapSnapshotInternal(
    nodes,
    node_fields,
    node_types[0],
    edges,
    edge_fields,
    edge_types[0],
    strings,
    locations,
    location_fields,
  )
}
