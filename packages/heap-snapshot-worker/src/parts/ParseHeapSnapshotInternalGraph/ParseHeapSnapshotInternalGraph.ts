import * as Assert from '../Assert/Assert.ts'
import type { GraphEdge, HeapSnapshotGraph, ParsedEdge } from '../Snapshot/Snapshot.ts'

interface GraphNode {
  readonly edgeCount: number
  readonly id: number
}

type EdgeLike = Pick<ParsedEdge, 'toNode'> & {
  readonly nameOrIndex: string | number
}

export const parseHeapSnapshotInternalGraph = (nodes: readonly GraphNode[], edges: readonly EdgeLike[]): HeapSnapshotGraph => {
  Assert.array(edges)
  Assert.array(nodes)
  const graph: HeapSnapshotGraph = Object.create(null)
  for (const node of nodes) {
    graph[node.id] = []
  }
  let edgeIndex = 0
  for (const node of nodes) {
    for (let i = 0; i < node.edgeCount; i++) {
      const edge = edges[edgeIndex++]
      graph[node.id].push({ index: edge.toNode, name: edge.nameOrIndex } satisfies GraphEdge)
    }
  }
  return graph
}
