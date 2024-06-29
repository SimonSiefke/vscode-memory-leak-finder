import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.js'

export const parseHeapSnapshotInternalEdges = (edges, edgeFields, edgeTypes, nodeFieldCount, strings) => {
  Assert.array(edges)
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
