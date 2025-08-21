import { getObjectWithPropertyNodeIndices } from '../GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getObjectsWithPropertiesNodeIndices = (snapshot: Snapshot, propertyName: string): readonly number[] => {
  const { meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const matchingNodeIndices = getObjectWithPropertyNodeIndices(
    snapshot,
    propertyName,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeCountFieldIndex,
  )
  return matchingNodeIndices
}
