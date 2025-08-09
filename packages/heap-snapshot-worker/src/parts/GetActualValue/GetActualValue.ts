import type { Snapshot } from '../Snapshot/Snapshot.js'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'
import { getUndefinedValue } from '../GetUndefinedValue/GetUndefinedValue.ts'

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
  const NODE_TYPE_OBJECT = nodeTypeNames.indexOf('object')
  const NODE_TYPE_ARRAY = nodeTypeNames.indexOf('array')

  const nodeType = targetNode.type
  const nodeTypeName = getNodeTypeName(targetNode, nodeTypes)

  // For strings, return the actual string value
  if (nodeType === NODE_TYPE_STRING) {
    const stringValue = getNodeName(targetNode, strings)
    if (stringValue !== null) {
      // Handle empty strings explicitly
      if (stringValue === '') {
        return '[empty string]'
      }
      return `"${stringValue}"`
    }
    return `[String ${targetNode.id}]`
  }

  // For numbers, return the actual number value
  if (nodeType === NODE_TYPE_NUMBER) {
    const numberValue = targetNode.name?.toString()
    return numberValue || `[Number ${targetNode.id}]`
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

      // Collect all string/number values from internal edges
      const internalStringValues: string[] = []
      const incomingStringValues: string[] = []
      const numberValues: string[] = []

      // Check edges from this code object
      for (const edge of nodeEdges) {
        // Follow internal edges to find string/number/object/array values
        if (edge.type === EDGE_TYPE_INTERNAL) {
          // Convert edge toNode from array index to node index
          const referencedNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type

            if (referencedType === NODE_TYPE_STRING) {
              // string
              const stringValue = getNodeName(referencedNode, strings)
              if (stringValue) {
                internalStringValues.push(stringValue)
              }
            } else if (referencedType === NODE_TYPE_NUMBER) {
              // number
              const numberValue = referencedNode.name?.toString()
              if (numberValue) {
                numberValues.push(numberValue)
              }
            } else if (referencedType === NODE_TYPE_OBJECT) {
              // object
              return `[Object ${referencedNode.id}]`
            } else if (referencedType === NODE_TYPE_ARRAY) {
              // array
              return `[Array ${referencedNode.id}]`
            }
          }
        }
      }

      // Also check incoming references to see if any have string names
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

            // If this is an internal edge with a string name, that might be the value
            if (edgeType === EDGE_TYPE_INTERNAL && edgeNameIndex < strings.length) {
              const edgeName = strings[edgeNameIndex]
              if (edgeName && edgeName !== '') {
                incomingStringValues.push(edgeName)
              }
            }
          }
        }
        currentEdgeOffset += sourceEdgeCount
      }

      // Prioritize incoming references over internal references
      // Look for specific meaningful values first, then return the first available
      const allIncomingValues = [...incomingStringValues]
      const allInternalValues = [...internalStringValues]

      // Prioritize "1" if it exists in incoming references
      const oneIndex = allIncomingValues.indexOf('1')
      if (oneIndex !== -1) {
        return '"1"'
      }

      // Return the first incoming string value found, or first internal string value, or first number value
      if (allIncomingValues.length > 0) {
        return `"${allIncomingValues[0]}"`
      } else if (allInternalValues.length > 0) {
        return `"${allInternalValues[0]}"`
      } else if (numberValues.length > 0) {
        return numberValues[0]
      }
    }
  }

  // For other types, return the standard format
  if (nodeType === NODE_TYPE_OBJECT) {
    return `[Object ${targetNode.id}]`
  } else if (nodeType === NODE_TYPE_ARRAY) {
    return `[Array ${targetNode.id}]`
  } else {
    return `[${nodeTypeName || 'Unknown'} ${targetNode.id}]`
  }
}
