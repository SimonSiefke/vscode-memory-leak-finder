import * as Assert from '../Assert/Assert.js'

export const parseHeapSnapshotInternalGraph = (nodes, edges) => {
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
      if (edge.toNode === 1168727) {
        console.log(edge)
      }
      graph[node.id].push(edge.toNode)
    }
  }
  return graph
}
