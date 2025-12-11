import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'
import { buildReferencePathFromEdge } from '../BuildReferencePathFromEdge/BuildReferencePathFromEdge.ts'

export const collectReferencesToLeakedNodes = (
  snapshot: Snapshot,
  leakedNodeByteOffsets: Set<number>,
  referencesMap: Map<number, Array<ReferencePath>>,
): void => {
  const { nodes, edges, strings, meta } = snapshot
  const { node_fields, edge_fields, node_types, edge_types } = meta

  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')

  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  const edgeTypeNames = edge_types[0] || []

  let currentEdgeOffset = 0
  for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]

    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      if (leakedNodeByteOffsets.has(edgeToNode)) {
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edgeTypeNames[edgeType] || `type_${edgeType}`

        const sourceNode = parseNode(sourceNodeIndex / ITEMS_PER_NODE, nodes, node_fields)
        if (!sourceNode) {
          continue
        }

        const sourceNodeName = getNodeName(sourceNode, strings)
        const sourceNodeType = getNodeTypeName(sourceNode, node_types)

        const referencePath = buildReferencePathFromEdge(sourceNode, sourceNodeName, sourceNodeType, edgeTypeName, edgeNameOrIndex, strings)

        const references = referencesMap.get(edgeToNode)
        if (references) {
          references.push(referencePath)
        }
      }
    }

    currentEdgeOffset += edgeCount
  }
}
