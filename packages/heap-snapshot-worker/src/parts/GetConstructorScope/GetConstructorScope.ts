interface ConstructorScopeNode {
  readonly id: number
  readonly name: string
}

export interface ConstructorScope {
  readonly scopeEdge: string
  readonly scopeNode: ConstructorScopeNode
}

export const getConstructorScope = (
  parsedNodes: readonly ConstructorScopeNode[],
  constructorScopeMap: Uint32Array,
  edgeMap: readonly string[],
  node: ConstructorScopeNode,
): ConstructorScope => {
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
