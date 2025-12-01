/**
 * Creates an edge map for fast lookups of node edges
 * @param nodes - The nodes array from the heap snapshot
 * @param nodeFields - The node fields metadata
 * @returns A Uint32Array where edgeMap[i] = start edge index for node i
 */
export const createEdgeMap = (nodes: Uint32Array, nodeFields: readonly string[]): Uint32Array => {
  const ITEMS_PER_NODE = nodeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

  // Create edge map for fast lookups: edgeMap[i] = start edge index for node i
  const edgeMap = new Uint32Array(nodes.length / ITEMS_PER_NODE)
  let currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    edgeMap[nodeIndex / ITEMS_PER_NODE] = currentEdgeOffset
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    currentEdgeOffset += edgeCount
  }

  return edgeMap
}
