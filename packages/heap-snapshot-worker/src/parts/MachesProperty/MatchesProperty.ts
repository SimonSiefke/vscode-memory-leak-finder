import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { getPrettyEdges } from '../GetPrettyEdges/GetPrettyEdges.ts'

const specialNodeIds = [
  7093, // instance before
  60081, // instance after

  58817, // map,

  58819, // prototype
  59725, // function
]

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
  const nodeId = nodes[absoluteIndex + nodeIdIndex]

  const isSpecial = specialNodeIds.includes(nodeId)
  if (isSpecial) {
    console.log({ nodeId, nodeEdges: getPrettyEdges(nodes, nodeEdges, strings, nodeIdIndex) })
  }

  for (let i = 0; i < nodeEdges.length; i += itemsPerEdge) {
    const edgeType = nodeEdges[i + edgeTypeFieldIndex]
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    const toIndex = nodeEdges[i + edgeToNodeIndex]
    if (edgeType === edgeTypeProperty && nameIndex === propertyNameIndex) {
      return true
    }
    if (edgeType === edgeTypeInternal && strings[nameIndex] === 'map') {
      const mapEdges = getNodeEdgesFast(toIndex / itemsPerNode, edgeMap, nodes, edges, itemsPerNode, itemsPerEdge, edgeCountFieldIndex)
      if (isSpecial) {
        console.log('got map')
        console.log({
          mapEdges: getPrettyEdges(nodes, mapEdges, strings, nodeIdIndex),
        })
      }
      for (let j = 0; j < mapEdges.length; j += itemsPerEdge) {
        const subEdgeType = nodeEdges[j + edgeTypeFieldIndex]
        const subEdgeNameIndex = nodeEdges[j + edgeNameFieldIndex]
        const subEdgeToIndex = nodeEdges[j + edgeToNodeIndex]
        if (subEdgeType === edgeTypeInternal && strings[subEdgeNameIndex] === 'prototype') {
          if (isSpecial) {
            console.log('got proto', nodes[subEdgeToIndex + nodeIdIndex])
          }
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
