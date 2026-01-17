export const getConstructorScope = (parsedNodes: any[], constructorScopeMap: any, edgeMap: any, node: any) => {
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
