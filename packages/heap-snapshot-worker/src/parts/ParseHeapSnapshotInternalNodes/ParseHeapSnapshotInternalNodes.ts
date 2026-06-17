import * as Assert from '../Assert/Assert.ts'
import * as ParseHeapSnapshotInternalObjects from '../ParseHeapSnapshotInternalObjects/ParseHeapSnapshotInternalObjects.ts'
import type { NumberArray, ParsedNode } from '../Snapshot/Snapshot.ts'

export const parseHeapSnapshotInternalNodes = (
  nodes: NumberArray,
  nodeFields: readonly string[],
  nodeTypes: readonly string[],
  strings: readonly string[],
): readonly ParsedNode[] => {
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
  ) as readonly ParsedNode[]
}
