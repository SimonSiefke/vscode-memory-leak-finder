import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'

export interface ClosureReference {
  readonly sourceNodeIndex: number
  readonly sourceNodeId: number
  readonly sourceNodeName: string | null
  readonly sourceNodeType: string | null
  readonly edgeType: string
  readonly edgeName: string
  readonly path: string
}

export const getClosureReferences = (targetNodeIndex: number, snapshot: Snapshot): readonly ClosureReference[] => {
  const { nodes, edges, strings, meta } = snapshot
  const { node_fields, edge_fields, node_types, edge_types } = meta

  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')

  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  const targetNode = parseNode(targetNodeIndex, nodes, node_fields)
  if (!targetNode) {
    return []
  }

  const targetNodeByteOffset = targetNodeIndex * ITEMS_PER_NODE

  const edgeTypeNames = edge_types[0] || []

  const references: ClosureReference[] = []
  let currentEdgeOffset = 0

  for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]

    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      if (edgeToNode === targetNodeByteOffset) {
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edgeTypeNames[edgeType] || `type_${edgeType}`

        const sourceNode = parseNode(sourceNodeIndex / ITEMS_PER_NODE, nodes, node_fields)
        if (!sourceNode) {
          continue
        }

        const sourceNodeId = sourceNode.id
        const sourceNodeName = getNodeName(sourceNode, strings)
        const sourceNodeType = getNodeTypeName(sourceNode, node_types)

        let edgeName = ''
        let path = ''

        if (edgeTypeName === 'property') {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
          if (sourceNodeName) {
            path = `${sourceNodeName}.${edgeName}`
          } else {
            path = `[Object ${sourceNodeId}].${edgeName}`
          }
        } else if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
          if (sourceNodeName) {
            path = `${sourceNodeName}${edgeName}`
          } else {
            path = `[Array ${sourceNodeId}]${edgeName}`
          }
        } else if (edgeTypeName === 'context') {
          edgeName = 'context'
          if (sourceNodeName) {
            path = `${sourceNodeName}.context`
          } else {
            path = `[Closure ${sourceNodeId}].context`
          }
        } else if (edgeTypeName === 'internal') {
          edgeName = 'internal'
          if (sourceNodeName) {
            path = `${sourceNodeName}.internal`
          } else {
            path = `[${sourceNodeType} ${sourceNodeId}].internal`
          }
        } else {
          edgeName = edgeTypeName
          if (sourceNodeName) {
            path = `${sourceNodeName}.${edgeTypeName}`
          } else {
            path = `[${sourceNodeType} ${sourceNodeId}].${edgeTypeName}`
          }
        }

        references.push({
          sourceNodeIndex: sourceNodeIndex / ITEMS_PER_NODE,
          sourceNodeId,
          sourceNodeName,
          sourceNodeType,
          edgeType: edgeTypeName,
          edgeName,
          path,
        })
      }
    }

    currentEdgeOffset += edgeCount
  }

  return references
}
