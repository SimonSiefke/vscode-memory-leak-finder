import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getObjectCountFromHeapSnapshot = async (path: string, objectName: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, strings, meta } = snapshot as any
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
