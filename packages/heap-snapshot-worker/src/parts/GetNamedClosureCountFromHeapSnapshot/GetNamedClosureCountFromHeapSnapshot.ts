import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'

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

export const getNamedClosureCountFromHeapSnapshot = async (id) => {
  const heapsnapshot = HeapSnapshotState.get(id)
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
