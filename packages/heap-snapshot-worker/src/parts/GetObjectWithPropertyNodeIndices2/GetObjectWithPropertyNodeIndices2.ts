import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Returns the node indices for all objects that have the given property name.
 * The returned indices are logical node indices (0-based), not array offsets.
 */
export const getObjectWithPropertyNodeIndices2 = (snapshot: Snapshot, propertyName: string): Uint32Array => {
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []

  if (!nodeFields.length || !edgeFields.length) {
    return new Uint32Array([])
  }

  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return new Uint32Array([])
  }

  const ITEMS_PER_NODE_LOCAL = nodeFields.length
  const ITEMS_PER_EDGE_LOCAL = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const toNodeIndex = edgeFields.indexOf('to_node')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const edgeMap = createEdgeMap(nodes, nodeFields)

  const result: number[] = []

  // let prev = ``
  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE_LOCAL) {
    const nodeIndex = nodeOffset / ITEMS_PER_NODE_LOCAL
    const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE_LOCAL, ITEMS_PER_EDGE_LOCAL, edgeCountFieldIndex)

    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE_LOCAL) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      const nameIndex = nodeEdges[i + edgeNameFieldIndex]
      if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
        result.push(nodeIndex)
        break
      }
    }
  }
  return new Uint32Array(result)
}
