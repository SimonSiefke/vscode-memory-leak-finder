import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getObjectCountFromHeapSnapshot = async (path, objectName) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, strings, meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const { objectTypeIndex, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex } = computeHeapSnapshotIndices(
    node_types,
    node_fields,
    edge_types,
    edge_fields,
  )
  const count = getThingCountFromHeapSnapshotInternal(
    nodes,
    strings,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    objectTypeIndex,
    objectName,
  )
  return count
}
