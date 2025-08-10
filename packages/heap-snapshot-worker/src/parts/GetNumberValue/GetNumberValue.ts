import type { Snapshot } from '../Snapshot/Snapshot.js'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'


/**
 * Gets the actual numeric value from a number node in a heap snapshot
 * @param targetNode - The target number node to get the value for
 * @param snapshot - The heap snapshot data
 * @param edgeMap - The edge map for fast lookups
 * @param visited - Set of visited node IDs to prevent circular references
 * @returns The actual numeric value as a number, or null if not found
 */
export const getNumberValue = (
  targetNode: any,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  visited: Set<number> = new Set(),
): number | null => {
  if (!targetNode || visited.has(targetNode.id)) {
    return null
  }
  visited.add(targetNode.id)

  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length

  // Get field indices
  const idFieldIndex = nodeFields.indexOf('id')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  // Get edge type names
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_ELEMENT = edgeTypes.indexOf('element')

  // Get node type names
  const nodeTypeNames = nodeTypes[0] || []
  const NODE_TYPE_STRING = nodeTypeNames.indexOf('string')
  const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')

  const nodeType = targetNode.type


  // Only process number nodes
  if (nodeType !== NODE_TYPE_NUMBER) {
    return null
  }

  const nodeName = getNodeName(targetNode, strings)

  // Handle snapshots where the numeric value is stored directly in the name field as a number
  if ((nodeName === null || nodeName === undefined) && typeof targetNode.name === 'number') {
    const raw = targetNode.name
    if (Number.isFinite(raw) && raw >= 0 && raw >= strings.length) {
      return raw
    }
  }

  // Check if the name is a valid number (SMI case)
  if (nodeName && nodeName !== '(heap number)' && !isNaN(Number(nodeName))) {
    return Number(nodeName)
  }

  // For heap numbers and smi numbers, try to find the actual value through edges
  if (nodeName === '(heap number)' || nodeName === 'smi number' || !nodeName) {
    // Find the node index for this target node
    let targetNodeIndex = -1
    for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
      if (nodes[i + idFieldIndex] === targetNode.id) {
        targetNodeIndex = i / ITEMS_PER_NODE
        break
      }
    }

    if (targetNodeIndex !== -1) {
      // Get edges using the edge map for fast lookup
      const nodeEdges = getNodeEdges(targetNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

      // Look for internal edges that might contain the actual numeric value
      for (const edge of nodeEdges) {
        if (edge.type === EDGE_TYPE_INTERNAL) {
          const edgeName = strings[edge.nameIndex] || ''

          // Special handling for "smi number" nodes: look for internal edges named "value"
          if (nodeName === 'smi number' && edgeName === 'value') {
            const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
            const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
            if (referencedNode) {
              const referencedType = referencedNode.type
              const referencedName = getNodeName(referencedNode, strings)

                          // If we find a string that looks like a number, that's likely the actual value
            if (referencedType === NODE_TYPE_STRING && referencedName && !isNaN(Number(referencedName))) {
              return Number(referencedName)
            }

              // If we find another number node, recursively get its value
              if (referencedType === NODE_TYPE_NUMBER && referencedName && referencedName !== '(heap number)') {
                if (!isNaN(Number(referencedName))) {
                  return Number(referencedName)
                }
              }
            }
          }

          // General case: Convert edge toNode from array index to node index
          const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type
            const referencedName = getNodeName(referencedNode, strings)

            // If we find a string that looks like a number, that's likely the actual value
            if (referencedType === NODE_TYPE_STRING && referencedName && !isNaN(Number(referencedName))) {
              return Number(referencedName)
            }

            // If we find another number node, recursively get its value
            if (referencedType === NODE_TYPE_NUMBER && referencedName && referencedName !== '(heap number)') {
              if (!isNaN(Number(referencedName))) {
                return Number(referencedName)
              }
            }
          }
        }
      }

      // Also check incoming references to see if any have numeric string names
      let currentEdgeOffset = 0
      for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
        const sourceEdgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]

        for (let j = 0; j < sourceEdgeCount; j++) {
          const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
          const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
          // Convert edge toNode from array index to node index
          const edgeToNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)

          if (edgeToNodeIndex === targetNodeIndex) {
            const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
            const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]

            // If this is an internal edge with a numeric string name, that might be the value
            if (edgeType === EDGE_TYPE_INTERNAL && edgeNameIndex < strings.length) {
              const edgeName = strings[edgeNameIndex]
              if (edgeName && edgeName !== '' && !isNaN(Number(edgeName))) {
                return Number(edgeName)
              }
            }
          }
        }
        currentEdgeOffset += sourceEdgeCount
      }

      // Enhanced search: look for property edges that might contain the numeric value
      // This is common in V8 where numbers are stored as properties
      for (const edge of nodeEdges) {
        if (edge.type === EDGE_TYPE_PROPERTY || edge.type === EDGE_TYPE_ELEMENT) {
          const edgeName = strings[edge.nameIndex] || ''

          // Check if the edge name itself is a number
          if (edgeName && !isNaN(Number(edgeName))) {
            return Number(edgeName)
          }

          // Follow the edge to see if it points to a string with the numeric value
          const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type
            const referencedName = getNodeName(referencedNode, strings)

            if (referencedType === NODE_TYPE_STRING && referencedName && !isNaN(Number(referencedName))) {
              return Number(referencedName)
            }
          }
        }
      }

      // Look for edges with numeric names in the edge name field
      for (const edge of nodeEdges) {
        const edgeName = strings[edge.nameIndex] || ''
        if (edgeName && !isNaN(Number(edgeName))) {
          return Number(edgeName)
        }
      }

      // Also check all edges for numeric names, regardless of type
      for (const edge of nodeEdges) {
        if (edge.nameIndex < strings.length) {
          const edgeName = strings[edge.nameIndex]
          if (edgeName && !isNaN(Number(edgeName))) {
            return Number(edgeName)
          }
        }
      }
    }
  }

  // Fallback: return the name if it's a valid number
  if (nodeName && !isNaN(Number(nodeName))) {
    return Number(nodeName)
  }

  return null
}
