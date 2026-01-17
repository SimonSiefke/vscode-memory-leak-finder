import * as Assert from '../Assert/Assert.ts'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.ts'

export const parseHeapSnapshotInternalNodes = (nodes: any, nodeFields: any, nodeTypes: any, strings: any) => {
  // Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  Assert.array(strings)
  const typeKey = 'type'
  const nameKey = 'name'
  const indexMultiplierKey = ''
  const indexMultiplier = 1
  return ParseHeapSnapshotInternalObjects.parseHeapSnapshotObjects(
    nodes,
    nodeFields,
    nodeTypes,
    typeKey,
    nameKey,
    indexMultiplierKey,
    indexMultiplier,
    strings,
  )
}
