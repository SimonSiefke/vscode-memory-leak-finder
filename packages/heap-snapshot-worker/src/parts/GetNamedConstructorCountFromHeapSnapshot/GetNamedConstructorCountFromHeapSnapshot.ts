import * as Assert from '../Assert/Assert.js'
import * as GetConstructorNodes from '../GetConstructorNodes/GetConstructorNodes.js'
import * as GetConstructorScope from '../GetConstructorScope/GetConstructorScope.js'
import * as GetConstructorScopeMap from '../GetConstructorScopeMap/GetConstructorScopeMap.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const createCounts = (constructorNodesWithInfo) => {
  const map = Object.create(null)
  for (const node of constructorNodesWithInfo) {
    map[node.name] ||= 0
    map[node.name]++
  }
  const array = Object.entries(map).map(([key, value]) => {
    return {
      name: key,
      count: value,
    }
  })
  return array
}

const isImportantScopeName = (name) => {
  switch (name) {
    case '':
    case 'Set':
    case 'Array':
    case '(object properties)':
    case 'system / Context':
      return false
    default:
      return true
  }
}

const getDetailedNodeInfo = (parsedNodes, scopeMap, edgeMap, node) => {
  const { scopeNode, scopeEdge } = GetConstructorScope.getConstructorScope(parsedNodes, scopeMap, edgeMap, node)
  const parentScope = GetConstructorScope.getConstructorScope(parsedNodes, scopeMap, edgeMap, scopeNode)
  if (isImportantScopeName(parentScope.scopeNode.name)) {
    const mergedNamed = `${parentScope.scopeNode.name}.${parentScope.scopeEdge} -> ${scopeNode.name}.${scopeEdge}`
    return {
      name: mergedNamed,
    }
  }
  const mergedNamed = `${scopeNode.name}.${scopeEdge}`
  return {
    name: mergedNamed,
  }
}

export const getNamedConstructorCountFromHeapSnapshot = async (heapsnapshot, constructorName) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const constructorNodes = GetConstructorNodes.getConstructorNodes(parsedNodes, constructorName)
  const { scopeMap, edgeMap } = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const constructorNodesWithInfo = constructorNodes.map((node) => {
    return getDetailedNodeInfo(parsedNodes, scopeMap, edgeMap, node)
  })
  const counts = createCounts(constructorNodesWithInfo)
  return counts
}
