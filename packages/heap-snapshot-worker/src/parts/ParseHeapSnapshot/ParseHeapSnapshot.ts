import * as ParseHeapSnapshotInternal from '../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.ts'
import type { HeapSnapshotInput, ParsedHeapSnapshot } from '../Snapshot/Snapshot.ts'

export const parseHeapSnapshot = (heapsnapshot: HeapSnapshotInput): ParsedHeapSnapshot => {
  const { edges, locations, nodes, snapshot, strings } = heapsnapshot
  const meta = snapshot?.meta ?? heapsnapshot.meta
  if (!meta) {
    throw new TypeError('no heap snapshot metadata found')
  }
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
