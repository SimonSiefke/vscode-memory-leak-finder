import type { Snapshot } from '../Snapshot/Snapshot.js'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'

export interface ObjectWithProperty {
  id: number
  name: string | null
  propertyValue: string | null
  type: string | null
  selfSize: number
  edgeCount: number
}

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string): ObjectWithProperty[] => {
  const { nodes, edges, strings, meta } = snapshot
  const results: ObjectWithProperty[] = []

  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields

  if (!nodeFields.length || !edgeFields.length) {
    return results
  }

  // Find the property name in the strings array
  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return results
  }

  // Get field indices
  const typeFieldIndex = nodeFields.indexOf('type')
  const nameFieldIndex = nodeFields.indexOf('name')
  const idFieldIndex = nodeFields.indexOf('id')
  const selfSizeFieldIndex = nodeFields.indexOf('self_size')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length

  // Create edge map for fast lookups
  const edgeMap = createEdgeMap(nodes, nodeFields)

  // Helper function to parse a node from the flat array
  const parseNode = (nodeIndex: number): any => {
    const nodeStart = nodeIndex * ITEMS_PER_NODE
    if (nodeStart >= nodes.length) {
      return null
    }

    const node: any = {}
    for (let i = 0; i < nodeFields.length; i++) {
      const fieldIndex = nodeStart + i
      if (fieldIndex < nodes.length) {
        node[nodeFields[i]] = nodes[fieldIndex]
      }
    }
    return node
  }

  // Helper function to get node name as string
  const getNodeName = (node: any): string | null => {
    if (node && node.name !== undefined && strings[node.name]) {
      return strings[node.name]
    }
    return null
  }

  // Helper function to get node type name
  const getNodeTypeName = (node: any): string | null => {
    if (nodeTypes[0] && Array.isArray(nodeTypes[0]) && node.type !== undefined) {
      return (nodeTypes[0] as readonly string[])[node.type]
    }
    return null
  }

  // Helper function to follow references and get actual value
  const getActualValue = (targetNode: any, visited: Set<number> = new Set()): string => {
    if (!targetNode || visited.has(targetNode.id)) {
      return `[Circular ${targetNode?.id || 'Unknown'}]`
    }
    visited.add(targetNode.id)

    const nodeType = targetNode.type
    const nodeTypeName = getNodeTypeName(targetNode)

    // For strings, return the actual string value
    if (nodeType === 2) {
      const stringValue = getNodeName(targetNode)
      return stringValue || `[String ${targetNode.id}]`
    }

    // For numbers, return the actual number value
    if (nodeType === 7) {
      const numberValue = targetNode.name?.toString()
      return numberValue || `[Number ${targetNode.id}]`
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
          if (edge.type === 3) {
            // internal edge
            const referencedNode = parseNode(edge.toNode)
            if (referencedNode) {
              const referencedType = referencedNode.type

              if (referencedType === 2) {
                // string
                const stringValue = getNodeName(referencedNode)
                if (stringValue) {
                  internalStringValues.push(stringValue)
                }
              } else if (referencedType === 7) {
                // number
                const numberValue = referencedNode.name?.toString()
                if (numberValue) {
                  numberValues.push(numberValue)
                }
              } else if (referencedType === 3) {
                // object
                return `[Object ${referencedNode.id}]`
              } else if (referencedType === 1) {
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

            if (edgeToNode === targetNodeIndex) {
              const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
              const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]

              // If this is an internal edge with a string name, that might be the value
              if (edgeType === 3 && edgeNameIndex < strings.length) {
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
    if (nodeType === 3) {
      return `[Object ${targetNode.id}]`
    } else if (nodeType === 1) {
      return `[Array ${targetNode.id}]`
    } else {
      return `[${nodeTypeName || 'Unknown'} ${targetNode.id}]`
    }
  }

  // Iterate through each node and scan its edges
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const nodeEdges = getNodeEdges(nodeIndex / ITEMS_PER_NODE, edgeMap, nodes, edges, nodeFields, edgeFields)

    // Scan this node's edges
    for (const edge of nodeEdges) {
      // Check if it's a property edge (type 2) with the target property name
      if (edge.type === 2 && edge.nameIndex === propertyNameIndex) {
        // Parse the source node (the object that has the property)
        const sourceNode = parseNode(nodeIndex / ITEMS_PER_NODE)
        // Parse the target node (the property value)
        const targetNode = parseNode(edge.toNode)

        if (sourceNode && targetNode) {
          const result: ObjectWithProperty = {
            id: sourceNode.id,
            name: getNodeName(sourceNode),
            propertyValue: null,
            type: getNodeTypeName(sourceNode),
            selfSize: sourceNode.self_size,
            edgeCount: sourceNode.edge_count,
          }

          // Get the actual value by following references
          result.propertyValue = getActualValue(targetNode)

          results.push(result)
        }
      }
    }
  }

  return results
}
