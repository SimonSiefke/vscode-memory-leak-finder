import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalEdges from '../ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.js'
import * as ParseHeapSnapshotInternalGraph from '../ParseHeapSnapshotInternalGraph/ParseHeapSnapshotInternalGraph.js'
import * as ParseHeapSnapshotInternalNodes from '../ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.js'

export const parseHeapSnapshotInternal = (nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  const parsedNodes = ParseHeapSnapshotInternalNodes.parseHeapSnapshotInternalNodes(nodes, nodeFields, nodeTypes)
  const parsedEdges = ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(edges, edgeFields, edgeTypes)
  const graph = ParseHeapSnapshotInternalGraph.parseHeapSnapshotInternalGraph(parsedNodes, parsedEdges)
  return {
    parsedNodes,
    graph,
  }
}
