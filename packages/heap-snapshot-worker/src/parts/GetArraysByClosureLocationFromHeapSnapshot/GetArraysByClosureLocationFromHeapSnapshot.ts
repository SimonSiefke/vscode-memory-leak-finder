import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import { getArraysByClosureLocationFromHeapSnapshotInternal } from './GetArraysByClosureLocationFromHeapSnapshotInternal.ts'

export const getArraysByClosureLocationFromHeapSnapshot = async (id: any, scriptMap: any) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const { edge_fields, edge_types, location_fields, node_fields, node_types } = heapsnapshot.snapshot.meta
  const { edges, locations, nodes, strings } = heapsnapshot
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
