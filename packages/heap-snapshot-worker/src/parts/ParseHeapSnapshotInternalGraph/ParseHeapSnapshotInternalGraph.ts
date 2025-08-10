import * as Assert from '../Assert/Assert.js'
import type { HeapSnapshotNode } from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.js'

interface GraphEdge {
  index: number
  name: string | number
}

interface InternalGraph {
  [key: number]: GraphEdge[]
}

export const parseHeapSnapshotInternalGraph = (nodes: HeapSnapshotNode[], edges: any[]): InternalGraph => {
  Assert.array(edges)
  Assert.array(nodes)
  const graph: InternalGraph = Object.create(null)
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
