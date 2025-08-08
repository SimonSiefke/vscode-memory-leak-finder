import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { getMapCountFromHeapSnapshotInternal } from '../GetMapCountFromHeapSnapshotInternal/GetMapCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getMapCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, strings, metaData } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta
  const { objectTypeIndex, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex } = computeHeapSnapshotIndices(
    node_types,
    node_fields,
    edge_types,
    edge_fields,
  )

  const mapCount = getMapCountFromHeapSnapshotInternal(nodes, strings, ITEMS_PER_EDGE, typeFieldIndex, nameFieldIndex, objectTypeIndex)
  return mapCount
}

const result = await getMapCountFromHeapSnapshot('/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json')
console.log('Map count:', result)
