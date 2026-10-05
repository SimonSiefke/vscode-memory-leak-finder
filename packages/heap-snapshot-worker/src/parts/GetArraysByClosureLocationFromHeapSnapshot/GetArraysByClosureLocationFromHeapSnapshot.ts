import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import type { HeapSnapshotInput } from '../Snapshot/Snapshot.ts'
import { getArraysByClosureLocationFromHeapSnapshotInternal } from './GetArraysByClosureLocationFromHeapSnapshotInternal.ts'

export interface ScriptMapEntry {
  readonly sourceMapUrl?: string
  readonly url?: string
}

export type ScriptMap = Readonly<Record<number, ScriptMapEntry>>

export const getArraysByClosureLocationFromHeapSnapshot = async (id: string, scriptMap: ScriptMap) => {
  const heapsnapshot = HeapSnapshotState.get<HeapSnapshotInput>(id)
  Assert.object(heapsnapshot)
  const { parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const meta = heapsnapshot.snapshot?.meta ?? heapsnapshot.meta
  if (!meta) {
    throw new TypeError('no heap snapshot metadata found')
  }
  const { edge_fields, edge_types, location_fields, node_fields, node_types } = meta
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
