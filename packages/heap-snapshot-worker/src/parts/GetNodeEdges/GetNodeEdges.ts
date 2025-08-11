import * as Assert from '../Assert/Assert.ts'

/**
 * Gets the edges for a specific node using the edge map
 * @param nodeIndex - The node index
 * @param edgeMap - The edge map created by createEdgeMap
 * @param nodes - The nodes array
 * @param edges - The edges array
 * @param nodeFields - The node fields metadata
 * @param edgeFields - The edge fields metadata
 * @returns Array of edge objects with type, nameIndex, and toNode properties
 */
export const getNodeEdges = (
  nodeIndex: number,
  edgeMap: Uint32Array,
  nodes: Uint32Array,
  edges: Uint32Array,
  nodeFields: readonly string[],
  edgeFields: readonly string[],
): Array<{ type: number; nameIndex: number; toNode: number }> => {
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  const startEdgeIndex = edgeMap[nodeIndex]
  Assert.number(startEdgeIndex)
  const edgeCount = nodes[nodeIndex * ITEMS_PER_NODE + edgeCountFieldIndex]
  const nodeEdges: Array<{ type: number; nameIndex: number; toNode: number }> = []

  for (let i = 0; i < edgeCount; i++) {
    const edgeIndex = (startEdgeIndex + i) * ITEMS_PER_EDGE
    nodeEdges.push({
      type: edges[edgeIndex + edgeTypeFieldIndex],
      nameIndex: edges[edgeIndex + edgeNameFieldIndex],
      toNode: edges[edgeIndex + edgeToNodeFieldIndex],
    })
  }

  return nodeEdges
}
