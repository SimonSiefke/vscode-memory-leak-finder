import * as ParseHeapSnapshotInternal from '../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

interface HeapSnapshotInput {
  readonly edges: Uint32Array
  readonly locations: Uint32Array
  readonly nodes: Uint32Array
  readonly snapshot?: Snapshot
  readonly strings: readonly string[]
  readonly meta?: Snapshot['meta']
}

export const parseHeapSnapshot = (heapsnapshot: HeapSnapshotInput) => {
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
