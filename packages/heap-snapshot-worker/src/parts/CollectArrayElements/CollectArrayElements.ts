import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'

/**
 * Collects elements from an array node, returning preview data
 * @param nodeIndex - The index of the array node
 * @param snapshot - The heap snapshot data
 * @param edgeMap - The edge map for fast lookups
 * @param depth - Maximum depth to traverse for nested objects/arrays
 * @param visited - Set of visited node IDs to prevent circular references
 * @param maxElements - Maximum number of elements to collect (default: 10)
 * @returns Array of element values
 */
export const collectArrayElements = (
  nodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  depth: number = 1,
  visited: Set<number> = new Set(),
  maxElements: number = 10,
): any[] => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []

  const ITEMS_PER_NODE = nodeFields.length
  const EDGE_TYPE_ELEMENT = edgeTypes.indexOf('element')

  // Parse the array node to get its ID for cycle detection
  const arrayNode = parseNode(nodeIndex, nodes, nodeFields)
  if (!arrayNode || visited.has(arrayNode.id)) {
    return []
  }

  // Temporarily add to visited set
  visited.add(arrayNode.id)

  try {
    // Get edges for this array node
    const nodeEdges = getNodeEdges(nodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

    // Collect element edges and sort by index
    const elementEdges: Array<{ index: number; toNode: number }> = []

    for (const edge of nodeEdges) {
      if (edge.type === EDGE_TYPE_ELEMENT) {
        const elementIndex = edge.nameIndex // For element edges, nameIndex is the array index
        elementEdges.push({
          index: elementIndex,
          toNode: edge.toNode,
        })
      }
    }

    // Sort by array index and limit to maxElements
    elementEdges.sort((a, b) => a.index - b.index)
    const limitedEdges = elementEdges.slice(0, maxElements)

    const elements: any[] = []

    for (const elementEdge of limitedEdges) {
      // Get the target node (the array element)
      const targetNodeIndex = Math.floor(elementEdge.toNode / ITEMS_PER_NODE)
      const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)
      if (!targetNode) continue

      const targetType = getNodeTypeName(targetNode, nodeTypes) || 'unknown'
      const targetName = getNodeName(targetNode, strings)

      // Check if this is an array (object with name "Array")
      const isArray = targetType === 'object' && targetName === 'Array'

      // Get the element value
      let value: any
      if (targetType === 'object' && !isArray) {
        if (depth > 1) {
          // For nested objects at depth > 1, we'll collect properties inline to avoid circular imports
          const nestedProperties = collectObjectPropertiesInline(targetNodeIndex, snapshot, edgeMap, depth - 1, visited)
          if (Object.keys(nestedProperties).length > 0) {
            value = nestedProperties
          } else {
            value = `[Object ${targetNode.id}]`
          }
        } else {
          value = `[Object ${targetNode.id}]`
        }
      } else if (isArray) {
        if (depth > 1) {
          // For nested arrays, recursively collect elements
          value = collectArrayElements(targetNodeIndex, snapshot, edgeMap, depth - 1, visited, maxElements)
        } else {
          value = `[Array ${targetNode.id}]`
        }
      } else if (targetType === 'string' || targetType === 'number') {
        // For primitives, get the actual value
        const actual = getActualValue(targetNode, snapshot, edgeMap, visited)
        if (targetType === 'number') {
          const parsed = Number(actual)
          if (Number.isFinite(parsed)) {
            value = parsed
          } else {
            value = actual
          }
        } else {
          value = actual
        }
      } else if (targetType === 'hidden') {
        // For hidden nodes, check if it's a boolean or other special value
        const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap)
        if (booleanValue) {
          value = booleanValue
        } else {
          value = getActualValue(targetNode, snapshot, edgeMap, visited)
        }
      } else if (targetType === 'code') {
        // For code objects, try to get the actual value they represent
        value = getActualValue(targetNode, snapshot, edgeMap, visited)
      } else {
        // For other types
        value = `[${targetType} ${targetNode.id}]`
      }

      elements.push(value)
    }

    return elements
  } finally {
    // Remove from visited set
    visited.delete(arrayNode.id)
  }
}

/**
 * Collects object properties inline to avoid circular imports
 * This is a simplified version of collectObjectProperties
 */
const collectObjectPropertiesInline = (
  nodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  depth: number,
  visited: Set<number>,
): Record<string, any> => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []

  const ITEMS_PER_NODE = nodeFields.length
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const properties: Record<string, any> = {}

  // Parse the node to get its ID for cycle detection
  const node = parseNode(nodeIndex, nodes, nodeFields)
  if (!node || visited.has(node.id) || depth <= 0) {
    return properties
  }

  // Get edges for this node
  const nodeEdges = getNodeEdges(nodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

  // Scan edges for properties
  for (const edge of nodeEdges) {
    if (edge.type === EDGE_TYPE_PROPERTY) {
      const propertyName = strings[edge.nameIndex]
      if (!propertyName) continue

      // Get the target node
      const targetNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
      const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)
      if (!targetNode) continue

      const targetType = getNodeTypeName(targetNode, nodeTypes) || 'unknown'
      const targetName = getNodeName(targetNode, strings)

      // Check if this is an array (object with name "Array")
      const isArray = targetType === 'object' && targetName === 'Array'

      // Get the property value
      let value: any
      if (targetType === 'object' && !isArray) {
        if (depth > 1) {
          const nestedProperties = collectObjectPropertiesInline(targetNodeIndex, snapshot, edgeMap, depth - 1, visited)
          if (Object.keys(nestedProperties).length > 0) {
            value = nestedProperties
          } else {
            value = `[Object ${targetNode.id}]`
          }
        } else {
          value = `[Object ${targetNode.id}]`
        }
      } else if (isArray) {
        if (depth > 1) {
          value = collectArrayElements(targetNodeIndex, snapshot, edgeMap, depth - 1, visited)
        } else {
          value = `[Array ${targetNode.id}]`
        }
      } else if (targetType === 'string' || targetType === 'number') {
        value = getActualValue(targetNode, snapshot, edgeMap, visited)
      } else if (targetType === 'hidden') {
        // For hidden nodes, check if it's a boolean or other special value
        const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap, propertyName)
        if (booleanValue) {
          value = booleanValue
        } else {
          value = getActualValue(targetNode, snapshot, edgeMap, visited)
        }
      } else if (targetType === 'code') {
        value = getActualValue(targetNode, snapshot, edgeMap, visited)
      } else {
        value = `[${targetType} ${targetNode.id}]`
      }

      properties[propertyName] = value
    }
  }

  return properties
}
