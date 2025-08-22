import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'

export const matchesProperty = (
  nodes: Uint32Array,
  absoluteIndex: number,
  itemsPerNode: number,
  edges: Uint32Array,
  itemsPerEdge: number,
  edgeCountFieldIndex: number,
  edgeTypeFieldIndex: number,
  edgeNameFieldIndex: number,
  edgeTypeProperty: number,
  edgeTypeInternal: number,
  edgeToNodeIndex: number,
  propertyNameIndex: number,
  nodeIdIndex: number,
  strings: readonly string[],
  edgeMap: Uint32Array,
): boolean => {
  const nodeIndex = absoluteIndex / itemsPerNode
  const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, itemsPerNode, itemsPerEdge, edgeCountFieldIndex)

  for (let i = 0; i < nodeEdges.length; i += itemsPerEdge) {
    const edgeType = nodeEdges[i + edgeTypeFieldIndex]
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    const toIndex = nodeEdges[i + edgeToNodeIndex]
    if (edgeType === edgeTypeProperty && nameIndex === propertyNameIndex) {
      return true
    }
    if (edgeType === edgeTypeInternal && strings[nameIndex] === 'map') {
      const mapEdges = getNodeEdgesFast(toIndex / itemsPerNode, edgeMap, nodes, edges, itemsPerNode, itemsPerEdge, edgeCountFieldIndex)

      for (let j = 0; j < mapEdges.length; j += itemsPerEdge) {
        const subEdgeType = mapEdges[j + edgeTypeFieldIndex]
        const subEdgeNameIndex = mapEdges[j + edgeNameFieldIndex]
        const subEdgeToIndex = mapEdges[j + edgeToNodeIndex]
        if (subEdgeType === edgeTypeInternal && strings[subEdgeNameIndex] === 'prototype') {
          return matchesProperty(
            nodes,
            subEdgeToIndex,
            itemsPerNode,
            edges,
            itemsPerEdge,
            edgeCountFieldIndex,
            edgeTypeFieldIndex,
            edgeNameFieldIndex,
            edgeTypeProperty,
            edgeTypeInternal,
            edgeToNodeIndex,
            propertyNameIndex,
            nodeIdIndex,
            strings,
            edgeMap,
          )
        }
      }
    }
  }
  return false
}
