import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

/**
 *
 * @param {import('../Snapshot/Snapshot.ts').Snapshot} snapshot
 * @param {*} typeName
 * @param {*} objectName
 * @returns
 */
export const getThingCountFromHeapSnapshot = (snapshot, typeName, objectName) => {
  const { nodes, strings, meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const typeIndex = node_types[0].indexOf(typeName)
  const { ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)
  const count = getThingCountFromHeapSnapshotInternal(nodes, strings, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex, typeIndex, objectName)
  return count
}
