import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'

export interface ClosureReference {
  readonly edgeName: string
  readonly edgeType: string
  readonly path: string
  readonly sourceNodeId: number
  readonly sourceNodeIndex: number
  readonly sourceNodeName: string | null
  readonly sourceNodeType: string | null
}

export const getClosureReferences = (targetNodeIndex: number, snapshot: Snapshot): readonly ClosureReference[] => {
  const { edges, meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta

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

        switch (edgeTypeName) {
          case 'context': {
            edgeName = 'context'
            if (sourceNodeName) {
              path = `${sourceNodeName}.context`
            } else {
              path = `[Closure ${sourceNodeId}].context`
            }

            break
          }
          case 'element': {
            edgeName = `[${edgeNameOrIndex}]`
            if (sourceNodeName) {
              path = `${sourceNodeName}${edgeName}`
            } else {
              path = `[Array ${sourceNodeId}]${edgeName}`
            }

            break
          }
          case 'internal': {
            edgeName = 'internal'
            if (sourceNodeName) {
              path = `${sourceNodeName}.internal`
            } else {
              path = `[${sourceNodeType} ${sourceNodeId}].internal`
            }

            break
          }
          case 'property': {
            edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
            if (sourceNodeName) {
              path = `${sourceNodeName}.${edgeName}`
            } else {
              path = `[Object ${sourceNodeId}].${edgeName}`
            }

            break
          }
          default: {
            edgeName = edgeTypeName
            if (sourceNodeName) {
              path = `${sourceNodeName}.${edgeTypeName}`
            } else {
              path = `[${sourceNodeType} ${sourceNodeId}].${edgeTypeName}`
            }
          }
        }

        references.push({
          edgeName,
          edgeType: edgeTypeName,
          path,
          sourceNodeId,
          sourceNodeIndex: sourceNodeIndex / ITEMS_PER_NODE,
          sourceNodeName,
          sourceNodeType,
        })
      }
    }

    currentEdgeOffset += edgeCount
  }

  return references
}
