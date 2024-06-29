import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.js'

export const parseHeapSnapshotInternalNodes = (nodes, nodeFields, nodeTypes) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(nodes, nodeFields, nodeTypes)
}
