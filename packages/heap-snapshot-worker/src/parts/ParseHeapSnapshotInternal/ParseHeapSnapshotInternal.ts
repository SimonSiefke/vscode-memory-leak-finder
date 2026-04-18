import * as Assert from '../Assert/Assert.ts'
import * as CleanNodes from '../CleanNodes/CleanNodes.ts'
import * as ParseHeapSnapshotInternalEdges from '../ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.ts'
import * as ParseHeapSnapshotInternalGraph from '../ParseHeapSnapshotInternalGraph/ParseHeapSnapshotInternalGraph.ts'
import * as ParseHeapSnapshotInternalNodes from '../ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.ts'
import * as ParseHeapSnapshotLocations from '../ParseHeapSnapshotLocations/ParseHeapSnapshotLocations.ts'

export const parseHeapSnapshotInternal = (
  nodes: Uint32Array,
  nodeFields: readonly string[],
  nodeTypes: readonly string[],
  edges: Uint32Array,
  edgeFields: readonly string[],
  edgeTypes: readonly string[],
  strings: readonly string[],
  locations: Uint32Array,
  locationFields: readonly string[],
) => {
  // Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  // Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  Assert.array(strings)
  // Assert.array(locations)
  Assert.array(locationFields)
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
  const parsedLocations = ParseHeapSnapshotLocations.parseHeapSnapshotLocations(locations, locationFields, nodeFields.length)
  return {
    graph,
    locations: parsedLocations,
    parsedNodes: cleanNodes,
  }
}
