import type { Snapshot } from '../Snapshot/Snapshot.js'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'

/**
 * Gets the actual numeric value from a number node in a heap snapshot
 * @param targetNode - The target number node to get the value for
 * @param snapshot - The heap snapshot data
 * @param edgeMap - The edge map for fast lookups
 * @param visited - Set of visited node IDs to prevent circular references
 * @returns The actual numeric value as a string, or null if not found
 */
export const getNumberValue = (targetNode: any, snapshot: Snapshot, edgeMap: Uint32Array, visited: Set<number> = new Set()): string | null => {
  console.log('getNumberValue called for node:', targetNode.id, 'type:', targetNode.type)
  
  if (!targetNode || visited.has(targetNode.id)) {
    console.log('Node already visited or null, returning null')
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

  // Get node type names
  const nodeTypeNames = nodeTypes[0] || []
  const NODE_TYPE_STRING = nodeTypeNames.indexOf('string')
  const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')

  const nodeType = targetNode.type
  const nodeTypeName = getNodeTypeName(targetNode, nodeTypes)

  console.log('Node type:', nodeType, 'NODE_TYPE_NUMBER:', NODE_TYPE_NUMBER, 'nodeTypeName:', nodeTypeName)

  // Only process number nodes
  if (nodeType !== NODE_TYPE_NUMBER) {
    console.log('Not a number node, returning null')
    return null
  }

  const nodeName = getNodeName(targetNode, strings)
  console.log('Node name:', nodeName)
  
  // Check if the name is a valid number (SMI case)
  if (nodeName && nodeName !== '(heap number)' && !isNaN(Number(nodeName))) {
    console.log('Found valid number in name:', nodeName)
    return nodeName
  }
  
  // For heap numbers, try to find the actual value through edges
  if (nodeName === '(heap number)' || !nodeName) {
    console.log('Processing heap number, looking for edges...')
    // Find the node index for this target node
    let targetNodeIndex = -1
    for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
      if (nodes[i + idFieldIndex] === targetNode.id) {
        targetNodeIndex = i / ITEMS_PER_NODE
        break
      }
    }

    if (targetNodeIndex !== -1) {
      console.log('Found target node index:', targetNodeIndex)
      // Get edges using the edge map for fast lookup
      const nodeEdges = getNodeEdges(targetNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)
      console.log('Found edges:', nodeEdges.length)

      // Look for internal edges that might contain the actual numeric value
      for (const edge of nodeEdges) {
        if (edge.type === EDGE_TYPE_INTERNAL) {
          console.log('Processing internal edge:', edge)
          // Convert edge toNode from array index to node index
          const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type
            const referencedName = getNodeName(referencedNode, strings)
            console.log('Referenced node type:', referencedType, 'name:', referencedName)

            // If we find a string that looks like a number, that's likely the actual value
            if (referencedType === NODE_TYPE_STRING && referencedName && !isNaN(Number(referencedName))) {
              console.log('Found numeric string in referenced node:', referencedName)
              return referencedName
            }
            
            // If we find another number node, recursively get its value
            if (referencedType === NODE_TYPE_NUMBER && referencedName && referencedName !== '(heap number)') {
              if (!isNaN(Number(referencedName))) {
                console.log('Found valid number in referenced number node:', referencedName)
                return referencedName
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
                console.log('Found numeric string in incoming edge:', edgeName)
                return edgeName
              }
            }
          }
        }
        currentEdgeOffset += sourceEdgeCount
      }
    }
  }
  
  // Fallback: return the name if it's a valid number
  if (nodeName && !isNaN(Number(nodeName))) {
    console.log('Fallback: returning valid number from name:', nodeName)
    return nodeName
  }
  
  console.log('No numeric value found, returning null')
  return null
}
