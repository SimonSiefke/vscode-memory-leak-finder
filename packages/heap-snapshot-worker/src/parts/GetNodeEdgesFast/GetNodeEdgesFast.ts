import * as Assert from '../Assert/Assert.ts'

export const getNodeEdgesFast = (
  nodeIndex: number,
  edgeMap: Uint32Array,
  nodes: Uint32Array,
  edges: Uint32Array,
  ITEMS_PER_NODE: number,
  ITEMS_PER_EDGE: number,
  edgeCountFieldIndex: number,
): Uint32Array => {
  const startEdgeIndex = edgeMap[nodeIndex]
  Assert.number(startEdgeIndex)
  const edgeCount = nodes[nodeIndex * ITEMS_PER_NODE + edgeCountFieldIndex]
  const start = startEdgeIndex * ITEMS_PER_EDGE
  const end = (startEdgeIndex + edgeCount) * ITEMS_PER_EDGE
  return edges.subarray(start, end)
}
