interface ParsedNode {
  [key: string]: any
}

interface ConstructorScopeResult {
  scopeNode: ParsedNode
  scopeEdge: any
}

export const getConstructorScope = (
  parsedNodes: ParsedNode[],
  constructorScopeMap: Record<number, number>,
  edgeMap: Record<number, any>,
  node: ParsedNode,
): ConstructorScopeResult => {
  // TODO avoid indexOf
  const nodeIndex = parsedNodes.indexOf(node)
  const constructorScopeIndex = constructorScopeMap[nodeIndex]
  const constructorScope = parsedNodes[constructorScopeIndex]
  const edge = edgeMap[nodeIndex]
  return {
    scopeNode: constructorScope,
    scopeEdge: edge,
  }
}
