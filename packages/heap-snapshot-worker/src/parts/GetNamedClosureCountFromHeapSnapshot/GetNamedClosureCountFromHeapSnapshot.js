import * as Assert from '../Assert/Assert.js'
import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isClosure = (node) => {
  return node.type === 'closure'
}

const isContext = (edge) => {
  return edge.name === 'context'
}

const getName = (node, contextNodes) => {
  if (node.name) {
    return node.name
  }
  return contextNodes
    .map((node) => node.name)
    .join(':')
    .slice(0, 100)
}

export const getNamedClosureCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closures = parsedNodes.filter(isClosure)
  const mapped = closures.map((node) => {
    const edges = graph[node.id]
    const contextEdge = edges.find(isContext)
    if (!contextEdge) {
      return node
    }
    const contextNode = parsedNodes[contextEdge.index]
    const contextNodeEdges = graph[contextNode.id].filter(IsImportantEdge.isImportantEdge)
    const contextNodeCount = contextNodeEdges.length
    const name = getName(node, contextNodeEdges)
    return {
      ...node,
      name,
      contextNodeCount,
    }
  })
  return mapped
}
