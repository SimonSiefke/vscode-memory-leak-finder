import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getObjectCountFromHeapSnapshot = async (path: string, objectName: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const { ITEMS_PER_EDGE, nameFieldIndex, objectTypeIndex, typeFieldIndex } = computeHeapSnapshotIndices(
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
