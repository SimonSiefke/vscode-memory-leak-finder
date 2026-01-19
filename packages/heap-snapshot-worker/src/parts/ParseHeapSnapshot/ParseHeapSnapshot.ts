import * as ParseHeapSnapshotInternal from '../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.ts'

export const parseHeapSnapshot = (heapsnapshot) => {
  const { edges, locations, nodes, snapshot, strings } = heapsnapshot
  const meta = heapsnapshot.meta || snapshot.meta
  const { edge_fields, edge_types, location_fields, node_fields, node_types } = meta
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
