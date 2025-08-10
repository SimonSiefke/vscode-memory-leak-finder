import * as Assert from '../Assert/Assert.js'

interface ParsedNode {
  type: string
  name: string
}

export const getConstructorNodes = (parsedNodes: ParsedNode[], constructorName: string): ParsedNode[] => {
  Assert.array(parsedNodes)
  Assert.string(constructorName)
  const filtered: ParsedNode[] = []
  for (const node of parsedNodes) {
    if (node.type === 'object' && node.name === constructorName) {
      filtered.push(node)
    }
  }
  return filtered
}
