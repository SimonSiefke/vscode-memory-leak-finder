import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import { getArraysByClosureLocationFromHeapSnapshotInternal } from './GetArraysByClosureLocationFromHeapSnapshotInternal.js'

export const getArraysByClosureLocationFromHeapSnapshot = async (id, scriptMap) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const { node_types, node_fields, edge_types, edge_fields, location_fields } = heapsnapshot.snapshot.meta
  const { nodes, edges, strings, locations } = heapsnapshot
  return getArraysByClosureLocationFromHeapSnapshotInternal(
    strings,
    nodes,
    node_types,
    node_fields,
    edges,
    edge_types,
    edge_fields,
    parsedNodes,
    locations,
    location_fields,
    scriptMap,
  )
} 