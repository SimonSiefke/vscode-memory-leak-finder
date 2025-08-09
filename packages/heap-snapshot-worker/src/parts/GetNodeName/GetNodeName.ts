/**
 * Gets the name of a node as a string from the strings array
 * @param node - The parsed node object
 * @param strings - The strings array from the heap snapshot
 * @returns The node name as a string or null if not found
 */
export const getNodeName = (node: any, strings: readonly string[]): string | null => {
  if (node && node.name !== undefined && strings[node.name]) {
    return strings[node.name]
  }
  return null
}
