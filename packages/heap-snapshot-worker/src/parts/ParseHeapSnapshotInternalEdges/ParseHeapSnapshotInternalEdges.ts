import * as Assert from '../Assert/Assert.ts'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.ts'
import type { ParsedEdge } from '../Snapshot/Snapshot.ts'

export const parseHeapSnapshotInternalEdges = (
  edges: readonly number[],
  edgeFields: readonly string[],
  edgeTypes: readonly (readonly string[])[],
  nodeFieldCount: number,
  strings: readonly string[],
): readonly ParsedEdge[] => {
  // Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  Assert.number(nodeFieldCount)
  Assert.array(strings)
  const typeKey = 'type'
  const nameKey = 'nameOrIndex'
  const indexMultiplierKey = 'toNode'
  const indexMultiplier = nodeFieldCount
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(
    edges,
    edgeFields,
    edgeTypes[0] || [],
    typeKey,
    nameKey,
    indexMultiplierKey,
    indexMultiplier,
    strings,
  ) as readonly ParsedEdge[]
}
