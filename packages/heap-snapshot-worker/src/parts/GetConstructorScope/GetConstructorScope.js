export const getConstructorScope = (parsedNodes, constructorScopeMap, node) => {
  // TODO avoid indexOf
  const nodeIndex = parsedNodes.indexOf(node)
  const constructorScopeIndex = constructorScopeMap[nodeIndex]
  const constructorScope = parsedNodes[constructorScopeIndex]
  return constructorScope
}
