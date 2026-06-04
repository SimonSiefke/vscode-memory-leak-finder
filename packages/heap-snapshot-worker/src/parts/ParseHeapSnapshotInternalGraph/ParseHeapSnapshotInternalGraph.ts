import * as Assert from '../Assert/Assert.ts'

interface NodeWithIdAndEdgeCount {
  readonly id: number
  readonly edgeCount: number
}

interface EdgeWithToNodeAndName {
  readonly toNode: number
  readonly nameOrIndex: string
}

interface GraphNode {
  readonly index: number
  readonly name: string
}

type Graph = Record<number, readonly GraphNode[]>

export const parseHeapSnapshotInternalGraph = (
  nodes: readonly NodeWithIdAndEdgeCount[],
  edges: readonly EdgeWithToNodeAndName[],
): Graph => {
  Assert.array(edges)
  Assert.array(nodes)
  const graph = Object.create(null)
  for (const node of nodes) {
    graph[node.id] = []
  }
  let edgeIndex = 0
  for (const node of nodes) {
    for (let i = 0; i < node.edgeCount; i++) {
      const edge = edges[edgeIndex++]
      graph[node.id].push({ index: edge.toNode, name: edge.nameOrIndex })
    }
  }
  return graph
}
