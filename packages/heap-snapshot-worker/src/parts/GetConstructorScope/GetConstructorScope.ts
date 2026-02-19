interface ParsedNode {
  readonly id: number
  readonly name: string
  readonly type: string
}

interface ConstructorScopeResult {
  readonly scopeEdge: string
  readonly scopeNode: ParsedNode
}

export const getConstructorScope = (
  parsedNodes: readonly ParsedNode[],
  constructorScopeMap: Uint32Array,
  edgeMap: readonly string[],
  node: ParsedNode,
): ConstructorScopeResult => {
  // TODO avoid indexOf
  const nodeIndex = parsedNodes.indexOf(node)
  const constructorScopeIndex = constructorScopeMap[nodeIndex]
  const constructorScope = parsedNodes[constructorScopeIndex]
  const edge = edgeMap[nodeIndex]
  return {
    scopeEdge: edge,
    scopeNode: constructorScope,
  }
}
