import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'

interface NodeWithType {
  readonly type: string
}

interface EdgeWithName {
  readonly name: string
}

interface NodeWithName extends NodeWithType {
  readonly name: string
  readonly id: number
}

interface GraphEdge {
  readonly index: number
  readonly name: string
}

const isClosure = (node: NodeWithType): boolean => {
  return node.type === 'closure'
}

const isContext = (edge: EdgeWithName): boolean => {
  return edge.name === 'context'
}

const getName = (node: NodeWithName, contextNodes: readonly EdgeWithName[]): string => {
  if (node.name) {
    return node.name
  }
  return contextNodes
    .map((node) => node.name)
    .join(':')
    .slice(0, 100)
}

interface ClosureWithContextCount extends NodeWithName {
  readonly contextNodeCount: number
}

export const getNamedClosureCountFromHeapSnapshot = async (id: number): Promise<readonly ClosureWithContextCount[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { graph, parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
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
      contextNodeCount,
      name,
    }
  })
  const sorted = mapped.toSorted((a: ClosureWithContextCount, b: ClosureWithContextCount) => {
    return (b.contextNodeCount || 0) - (a.contextNodeCount || 0) || a.name.localeCompare(b.name)
  })
  return sorted
}
