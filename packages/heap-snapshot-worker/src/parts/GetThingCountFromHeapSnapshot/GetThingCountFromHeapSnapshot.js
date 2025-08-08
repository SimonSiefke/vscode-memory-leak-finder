import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getThingCountFromHeapSnapshot = async (path, typeName, objectName) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, strings, metaData } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta
  const typeIndex = node_types[0].indexOf(typeName)
  const { ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)
  const count = getThingCountFromHeapSnapshotInternal(nodes, strings, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex, typeIndex, objectName)
  return count
}
