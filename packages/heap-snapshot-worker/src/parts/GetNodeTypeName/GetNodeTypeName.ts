/**
 * Gets the type name of a node as a string from the node types metadata
 * @param node - The parsed node object
 * @param nodeTypes - The node types metadata from the heap snapshot
 * @returns The node type name as a string or null if not found
 */
export const getNodeTypeName = (node: any, nodeTypes: readonly (readonly string[])[]): string | null => {
  if (nodeTypes[0] && Array.isArray(nodeTypes[0]) && node.type !== undefined) {
    return (nodeTypes[0] as readonly string[])[node.type]
  }
  return null
}
