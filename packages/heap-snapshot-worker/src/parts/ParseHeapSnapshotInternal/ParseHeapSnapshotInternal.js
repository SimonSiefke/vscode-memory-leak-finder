import * as Assert from '../Assert/Assert.js'
import * as CleanNodes from '../CleanNodes/CleanNodes.js'
import * as ParseHeapSnapshotInternalEdges from '../ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.js'
import * as ParseHeapSnapshotInternalGraph from '../ParseHeapSnapshotInternalGraph/ParseHeapSnapshotInternalGraph.js'
import * as ParseHeapSnapshotInternalNodes from '../ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.js'
import * as ParseHeapSnapshotLocations from '../ParseHeapSnapshotLocations/ParseHeapSnapshotLocations.js'

export const parseHeapSnapshotInternal = (
  nodes,
  nodeFields,
  nodeTypes,
  edges,
  edgeFields,
  edgeTypes,
  strings,
  locations,
  locationFields,
) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  Assert.array(edges)
  Assert.array(edgeFields)
  Assert.array(edgeTypes)
  Assert.array(strings)
  Assert.array(locations)
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
    parsedNodes: cleanNodes,
    graph,
    locations: parsedLocations,
  }
}
