import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.js'

export const parseHeapSnapshotInternalNodes = (nodes, nodeFields, nodeTypes, strings) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  Assert.array(strings)
  const typeKey = 'type'
  const nameKey = 'name'
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(nodes, nodeFields, nodeTypes, typeKey, nameKey, strings)
}
