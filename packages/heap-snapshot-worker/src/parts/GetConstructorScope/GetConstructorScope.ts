interface ConstructorScopeNode {
  readonly id: number
  readonly name: string
}

export interface ConstructorScope {
  readonly scopeEdge: string | number
  readonly scopeNode: ConstructorScopeNode
}

export const getConstructorScope = (
  parsedNodes: readonly ConstructorScopeNode[],
  constructorScopeMap: Uint32Array,
  edgeMap: ArrayLike<string | number>,
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
