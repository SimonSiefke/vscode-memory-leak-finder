import * as Assert from '../Assert/Assert.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import { getArraysByClosureLocationFromHeapSnapshotInternal } from './GetArraysByClosureLocationFromHeapSnapshotInternal.ts'

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
