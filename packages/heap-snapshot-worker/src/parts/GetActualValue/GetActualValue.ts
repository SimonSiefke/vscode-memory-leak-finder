import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getNumberValue } from '../GetNumberValue/GetNumberValue.ts'
import { getUndefinedValue } from '../GetUndefinedValue/GetUndefinedValue.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.js'

/**
 * Gets the actual value of a node by following references for strings and numbers
 * @param targetNode - The target node to get the value for
 * @param snapshot - The heap snapshot data
 * @param edgeMap - The edge map for fast lookups
 * @param visited - Set of visited node IDs to prevent circular references
 * @returns The actual value as a string
 */
export const getActualValue = (targetNode: any, snapshot: Snapshot, edgeMap: Uint32Array, visited: Set<number> = new Set()): string => {
  if (!targetNode || visited.has(targetNode.id)) {
    return `[Circular ${targetNode?.id || 'Unknown'}]`
  }
  visited.add(targetNode.id)

  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields

  const ITEMS_PER_NODE = nodeFields.length
  // Get field indices
  const idFieldIndex = nodeFields.indexOf('id')

  // Get edge type names
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  // Get node type names
  const nodeTypeNames = nodeTypes[0] || []
  const NODE_TYPE_STRING = nodeTypeNames.indexOf('string')
  const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')

  const nodeType = targetNode.type
  const nodeTypeName = getNodeTypeName(targetNode, nodeTypes)

  // For strings, return the actual string value
  if (nodeType === NODE_TYPE_STRING) {
    const stringValue = getNodeName(targetNode, strings)
    if (stringValue !== null) {
      // Return the raw string value, let the display layer handle quoting
      return stringValue
    }
    return `[String ${targetNode.id}]`
  }

  // For numbers, use the dedicated number parsing function
  if (nodeType === NODE_TYPE_NUMBER) {
    // Create a fresh visited set for number parsing to avoid conflicts
    const numberVisited = new Set<number>()
    const numberValue = getNumberValue(targetNode, snapshot, edgeMap, numberVisited)
    if (numberValue !== null) {
      return String(numberValue)
    }

    // If we can't get the actual value, provide more context about the node
    const nodeName = getNodeName(targetNode, strings)
    if (nodeName && nodeName !== '(heap number)') {
      return `[Number ${nodeName}]`
    }
    return `[Number ${targetNode.id}]`
  }

  // For hidden nodes, check if it's a boolean or undefined value
  if (nodeTypeName === 'hidden') {
    const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap)
    if (booleanValue) {
      return booleanValue
    }

    const undefinedValue = getUndefinedValue(targetNode, snapshot, edgeMap)
    if (undefinedValue) {
      return undefinedValue
    }
  }

  // For hidden nodes, check if it's a boolean or undefined value
  if (nodeTypeName === 'hidden') {
    const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap)
    if (booleanValue) {
      return booleanValue
    }

    const undefinedValue = getUndefinedValue(targetNode, snapshot, edgeMap)
    if (undefinedValue) {
      return undefinedValue
    }
  }

  // For code objects, try to follow internal references to find string/number values
  if (nodeTypeName === 'code') {
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

      // Look for internal edges that might contain the actual value
      for (const edge of nodeEdges) {
        if (edge.type === EDGE_TYPE_INTERNAL) {
          // Convert edge toNode from array index to node index
          const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type
            const referencedName = getNodeName(referencedNode, strings)

            // If we find a string, that's the actual value
            if (referencedType === NODE_TYPE_STRING && referencedName) {
              return referencedName
            }

            // If we find a number, get its actual value
            if (referencedType === NODE_TYPE_NUMBER) {
              // Create a fresh visited set for nested number parsing
              const nestedNumberVisited = new Set<number>()
              const nestedNumberValue = getNumberValue(referencedNode, snapshot, edgeMap, nestedNumberVisited)
              if (nestedNumberValue !== null) {
                return String(nestedNumberValue)
              }
            }
          }
        }
      }
    }
  }

  // For other types, return a descriptive reference
  return `[${nodeTypeName || 'Unknown'} ${targetNode.id}]`
}
