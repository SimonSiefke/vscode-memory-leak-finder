import * as Assert from '../Assert/Assert.js'
import * as GetConstructorScope from '../GetConstructorScope/GetConstructorScope.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as GetConstructorScopeMap from '../GetConstructorScopeMap/GetConstructorScopeMap.js'
import * as GetConstructorNodes from '../GetConstructorNodes/GetConstructorNodes.js'

export const getNamedConstructorCountFromHeapSnapshot = async (heapsnapshot, constructorName) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const constructorNodes = GetConstructorNodes.getConstructorNodes(parsedNodes, constructorName)
  const { scopeMap, edgeMap } = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const randomNode = constructorNodes.find((node) => node.id === 1496365)
  console.log({ randomNode })
  const constructorNodesWithInfo = constructorNodes.map((node) => {
    const { scopeNode, scopeEdge } = GetConstructorScope.getConstructorScope(parsedNodes, scopeMap, edgeMap, node)
    const parentScope = GetConstructorScope.getConstructorScope(parsedNodes, scopeMap, edgeMap, scopeNode)
    const mergedNamed = `${parentScope.scopeNode.name}.${parentScope.scopeEdge} -> ${scopeNode.name}.${scopeEdge}`
    return {
      name: mergedNamed,
    }
  })
  return constructorNodesWithInfo
}
