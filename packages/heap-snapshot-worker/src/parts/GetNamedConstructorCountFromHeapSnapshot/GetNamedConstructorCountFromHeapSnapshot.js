import * as Assert from '../Assert/Assert.js'
import * as GetConstructorScope from '../GetConstructorScope/GetConstructorScope.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as GetConstructorScopeMap from '../GetConstructorScopeMap/GetConstructorScopeMap.js'
import * as GetConstructorNodes from '../GetConstructorNodes/GetConstructorNodes.js'

export const getNamedConstructorCountFromHeapSnapshot = async (heapsnapshot, constructorName) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const constructorNodes = GetConstructorNodes.getConstructorNodes(parsedNodes, constructorName)
  const constructorScopeMap = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const constructorNodesWithInfo = constructorNodes.map((node) => {
    const constructorScope = GetConstructorScope.getConstructorScope(parsedNodes, constructorScopeMap, node)
    const mergedNamed = `${constructorScope.name}:${node.name}`
    return mergedNamed
  })
  return constructorNodesWithInfo
}
