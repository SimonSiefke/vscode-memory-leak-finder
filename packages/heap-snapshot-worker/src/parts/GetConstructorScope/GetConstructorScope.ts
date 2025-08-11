export const getConstructorScope = (parsedNodes, constructorScopeMap, edgeMap, node) => {
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
