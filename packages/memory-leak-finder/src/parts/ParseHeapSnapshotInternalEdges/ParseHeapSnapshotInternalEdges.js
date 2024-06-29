import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.js'

export const parseHeapSnapshotInternalEdges = (edges, edgeFields, edgeTypes, strings) => {
  Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  Assert.array(strings)
  const typeKey = 'type'
  const nameKey = 'nameOrIndex'
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(edges, edgeFields, edgeTypes, typeKey, nameKey, strings)
}
