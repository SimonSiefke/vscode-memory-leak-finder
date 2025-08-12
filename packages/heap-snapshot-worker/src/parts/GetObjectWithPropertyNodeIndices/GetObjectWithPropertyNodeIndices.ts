import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Returns the node indices for all objects that have the given property name.
 * The returned indices are logical node indices (0-based), not array offsets.
 */
export const getObjectWithPropertyNodeIndices = (snapshot: Snapshot, propertyName: string): number[] => {
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []

  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return []
  }

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')

  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const edgeMap = createEdgeMap(nodes, nodeFields)

  const result: number[] = []

  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE) {
    const nodeIndex = nodeOffset / ITEMS_PER_NODE
    const nodeEdges = getNodeEdges(nodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      const nameIndex = nodeEdges[i + edgeNameFieldIndex]
      if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
        result.push(nodeIndex)
        break
      }
    }
  }

  return result
}
