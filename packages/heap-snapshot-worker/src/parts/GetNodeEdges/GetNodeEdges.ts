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
): Uint32Array => {
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

  const startEdgeIndex = edgeMap[nodeIndex]
  Assert.number(startEdgeIndex)
  const edgeCount = nodes[nodeIndex * ITEMS_PER_NODE + edgeCountFieldIndex]

  const start = startEdgeIndex * ITEMS_PER_EDGE
  const end = (startEdgeIndex + edgeCount) * ITEMS_PER_EDGE
  return edges.subarray(start, end)
}
