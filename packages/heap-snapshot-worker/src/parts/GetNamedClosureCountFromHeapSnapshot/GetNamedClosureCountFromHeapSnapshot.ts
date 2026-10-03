import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import type { CleanedNode, GraphEdge } from '../Snapshot/Snapshot.ts'

export interface ClosureNode extends CleanedNode {
  readonly contextNodeCount: number
}

const isClosure = (node: CleanedNode): boolean => {
  return node.type === 'closure'
}

const isContext = (edge: GraphEdge): boolean => {
  return edge.name === 'context'
}

const getName = (node: CleanedNode, contextNodes: readonly GraphEdge[]): string => {
  if (node.name) {
    return node.name
  }
  return contextNodes
    .map((edge) => edge.name)
    .join(':')
    .slice(0, 100)
}

export const getNamedClosureCountFromHeapSnapshot = async (id: string): Promise<readonly ClosureNode[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { graph, parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closures = parsedNodes.filter(isClosure)
  const mapped = closures.map((node) => {
    const edges = graph[node.id]
    const contextEdge = edges.find(isContext)
    if (!contextEdge) {
      return {
        ...node,
        contextNodeCount: 0,
      }
    }
    const contextNode = parsedNodes[contextEdge.index]
    const contextNodeEdges = graph[contextNode.id].filter(IsImportantEdge.isImportantEdge)
    const contextNodeCount = contextNodeEdges.length
    const name = getName(node, contextNodeEdges)
    return {
      ...node,
      contextNodeCount,
      name,
    }
  })
  const sorted = mapped.toSorted((a: ClosureNode, b: ClosureNode) => {
    return b.contextNodeCount - a.contextNodeCount || a.name.localeCompare(b.name)
  })
  return sorted
}
