import * as Assert from '../Assert/Assert.ts'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.ts'

export const parseHeapSnapshotInternalEdges = (
  edges: Uint32Array,
  edgeFields: readonly string[],
  edgeTypes: readonly string[],
  nodeFieldCount: number,
  strings: readonly string[],
) => {
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
    edgeTypes,
    typeKey,
    nameKey,
    indexMultiplierKey,
    indexMultiplier,
    strings,
  )
}
