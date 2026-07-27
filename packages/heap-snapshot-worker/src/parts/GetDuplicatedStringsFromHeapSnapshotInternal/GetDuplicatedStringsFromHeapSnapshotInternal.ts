import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getDuplicatedStringsFromHeapSnapshotInternal = (snapshot: Snapshot): readonly string[] => {
  const { meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const { ITEMS_PER_NODE, nameFieldIndex, nodeTypes, typeFieldIndex } = computeHeapSnapshotIndices(
    node_types,
    node_fields,
    edge_types,
    edge_fields,
  )
  const stringTypeIndex = nodeTypes.indexOf('string')
  if (stringTypeIndex < 0 || ITEMS_PER_NODE <= 0 || typeFieldIndex < 0 || nameFieldIndex < 0) {
    return []
  }

  const counts = new Map<string, number>()
  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE) {
    if (nodes[nodeOffset + typeFieldIndex] !== stringTypeIndex) {
      continue
    }
    const value = strings[nodes[nodeOffset + nameFieldIndex]]
    if (typeof value === 'string') {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  const duplicated: string[] = []
  for (const [value, count] of counts) {
    if (count > 1) {
      duplicated.push(value)
    }
  }
  return duplicated
}
