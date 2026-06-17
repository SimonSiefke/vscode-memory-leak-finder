import * as Assert from '../Assert/Assert.ts'
import type { HeapSnapshotGraph, ParsedEdge, ParsedNode } from '../Snapshot/Snapshot.ts'

export const parseHeapSnapshotInternalGraph = (nodes: readonly ParsedNode[], edges: readonly ParsedEdge[]): HeapSnapshotGraph => {
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
      graph[node.id].push({ index: edge.toNode, name: edge.nameOrIndex })
    }
  }
  return graph
}
