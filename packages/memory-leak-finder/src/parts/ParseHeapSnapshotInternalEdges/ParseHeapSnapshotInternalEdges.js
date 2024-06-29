import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.js'

export const parseHeapSnapshotInternalEdges = (edges, edgeFields, edgeTypes) => {
  Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(edges, edgeFields, edgeTypes)
}
