import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.ts'

/**
 *
 * @param {import('../Snapshot/Snapshot.ts').Snapshot} snapshot
 * @param {*} typeName
 * @param {*} objectName
 * @returns {number}
 */
export const getThingCountFromHeapSnapshot = (snapshot, typeName, objectName) => {
  const { meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const typeIndex = node_types[0].indexOf(typeName)
  const { ITEMS_PER_EDGE, nameFieldIndex, typeFieldIndex } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)
  const count = getThingCountFromHeapSnapshotInternal(nodes, strings, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex, typeIndex, objectName)
  return count
}
