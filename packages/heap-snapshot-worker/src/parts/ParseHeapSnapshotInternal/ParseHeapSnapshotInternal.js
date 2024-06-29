import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshotInternalEdges from '../ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.js'
import * as ParseHeapSnapshotInternalGraph from '../ParseHeapSnapshotInternalGraph/ParseHeapSnapshotInternalGraph.js'
import * as ParseHeapSnapshotInternalNodes from '../ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.js'
import * as CleanNodes from '../CleanNodes/CleanNodes.js'

export const parseHeapSnapshotInternal = (nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes, strings) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  Assert.array(strings)
  const parsedNodes = ParseHeapSnapshotInternalNodes.parseHeapSnapshotInternalNodes(nodes, nodeFields, nodeTypes, strings)
  const parsedEdges = ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(
    edges,
    edgeFields,
    edgeTypes,
    nodeFields.length,
    strings,
  )
  const graph = ParseHeapSnapshotInternalGraph.parseHeapSnapshotInternalGraph(parsedNodes, parsedEdges)
  const cleanNodes = CleanNodes.cleanNode(parsedNodes)
  return {
    parsedNodes: cleanNodes,
    graph,
  }
}
