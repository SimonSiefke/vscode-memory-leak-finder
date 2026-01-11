/**
 * Parses a node from the flat nodes array at the given index
 * @param nodeIndex - The index of the node to parse
 * @param nodes - The flat nodes array from the heap snapshot
 * @param nodeFields - The node fields metadata
 * @returns The parsed node object or null if the index is out of bounds
 */
export const parseNode = (nodeIndex: number, nodes: Uint32Array, nodeFields: readonly string[]): any => {
  const ITEMS_PER_NODE = nodeFields.length
  const nodeStart = nodeIndex * ITEMS_PER_NODE

  if (nodeStart >= nodes.length) {
    return null
  }

  const node: any = {}
  for (let i = 0; i < nodeFields.length; i++) {
    const fieldIndex = nodeStart + i
    if (fieldIndex < nodes.length) {
      node[nodeFields[i]] = nodes[fieldIndex]
    }
  }
  return node
}
