import type { Snapshot } from '../Snapshot/Snapshot.js'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { collectArrayElements } from '../CollectArrayElements/CollectArrayElements.ts'
import { getBooleanValue, getBooleanStructure } from '../GetBooleanValue/GetBooleanValue.ts'

export interface ObjectWithProperty {
  id: number
  name: string | null
  propertyValue: string | boolean | number | null
  type: string | null
  selfSize: number
  edgeCount: number
  preview?: Record<string, any>
}

const tryResolveNestedNumeric = (
  containerNodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName: string,
  visited: Set<number>,
): number | null => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types
  const ITEMS_PER_NODE = nodeFields.length

  const propertyNameIndex = strings.findIndex((s) => s === propertyName)
  if (propertyNameIndex === -1) {
    return null
  }

  const nodeEdges = getNodeEdges(containerNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)
  for (const edge of nodeEdges) {
    if (edge.nameIndex === propertyNameIndex) {
      const targetIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
      const nestedNode = parseNode(targetIndex, nodes, nodeFields)
      if (!nestedNode) continue
      const nestedType = getNodeTypeName(nestedNode, nodeTypes) || 'unknown'
      if (nestedType === 'number' || nestedType === 'string' || nestedType === 'code' || nestedType === 'hidden') {
        const actual = getActualValue(nestedNode, snapshot, edgeMap, visited)
        const parsed = Number(actual)
        if (Number.isFinite(parsed)) {
          return parsed
        }
      }
    }
  }
  return null
}

/**
 * Collects properties of an object with optional depth control
 * @param nodeIndex - The index of the node to collect properties for
 * @param snapshot - The heap snapshot data
 * @param edgeMap - The edge map for fast lookups
 * @param depth - Maximum depth to traverse (0 = no properties, 1 = direct properties only)
 * @param visited - Set of visited node IDs to prevent circular references
 * @returns Record of property name to value (can be nested objects/arrays)
 */
export const collectObjectProperties = (
  nodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  depth: number = 1,
  visited: Set<number> = new Set(),
): Record<string, any> => {
  if (depth <= 0) {
    return {}
  }

  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields

  const ITEMS_PER_NODE = nodeFields.length
  const node = parseNode(nodeIndex, nodes, nodeFields)

  if (!node || visited.has(node.id)) {
    return {}
  }
  visited.add(node.id)

  // Get edge type names
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const properties: Record<string, any> = {}

  // Get edges for this node
  const nodeEdges = getNodeEdges(nodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

  // Scan edges for properties (excluding internal edges which don't count toward depth)
  for (const edge of nodeEdges) {
    if (edge.type === EDGE_TYPE_PROPERTY) {
      // This is a property edge
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

      // Get the property value (can be nested object/array or primitive)
      let value: any
      if (targetType === 'object' && !isArray) {
        if (depth > 1) {
          // At depth > 1, recursively collect properties of nested objects
          const nestedProperties = collectObjectProperties(targetNodeIndex, snapshot, edgeMap, depth - 1, visited)
          if (Object.keys(nestedProperties).length > 0) {
            // Return as nested object
            value = nestedProperties
          } else {
            // No properties found, show reference
            value = `[Object ${targetNode.id}]`
          }
        } else {
          // At depth 1, just show reference
          value = `[Object ${targetNode.id}]`
        }
      } else if (isArray) {
        if (depth > 1) {
          // For arrays at depth > 1, collect array elements
          const arrayElements = collectArrayElements(targetNodeIndex, snapshot, edgeMap, depth - 1, visited)
          if (arrayElements.length > 0) {
            value = arrayElements
          } else {
            value = `[Array ${targetNode.id}]`
          }
        } else {
          // At depth 1, just show reference
          value = `[Array ${targetNode.id}]`
        }
      } else if (targetType === 'array') {
        if (depth > 1) {
          // For arrays at depth > 1, we could collect indexed elements
          // For now, show reference but could be enhanced later
          value = `[Array ${targetNode.id}]`
        } else {
          // At depth 1, just show reference
          value = `[Array ${targetNode.id}]`
        }
      } else if (targetType === 'string' || targetType === 'number') {
        // For primitives, get the actual value (use fresh visited to avoid sibling cross-contamination)
        const actual = getActualValue(targetNode, snapshot, edgeMap, new Set())
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
        const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap, propertyName)
        if (booleanValue) {
          // Convert boolean strings to actual boolean values for preview
          if (booleanValue === 'true') {
            value = true
          } else if (booleanValue === 'false') {
            value = false
          } else {
            value = booleanValue
          }
        } else {
          value = getActualValue(targetNode, snapshot, edgeMap, new Set())
        }
      } else if (targetType === 'code') {
        // For code objects, try to get the actual value they represent
        value = getActualValue(targetNode, snapshot, edgeMap, new Set())
       } else {
         // For other types like closure, etc.
         value = `[${targetType} ${targetNode.id}]`
       }

      // Heuristic: For coordinate and size properties ('x','y','width','height'),
      // if value still looks like a reference, try to resolve nested numeric value
      if (
        (propertyName === 'x' || propertyName === 'y' || propertyName === 'width' || propertyName === 'height') &&
        (typeof value === 'string' && value.startsWith('['))
      ) {
        const nestedNumeric = tryResolveNestedNumeric(targetNodeIndex, snapshot, edgeMap, propertyName, visited)
        if (nestedNumeric !== null) {
          value = nestedNumeric
        }
      }

      properties[propertyName] = value
    }
  }

  return properties
}

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string, depth: number = 1): ObjectWithProperty[] => {
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

  const ITEMS_PER_NODE = nodeFields.length

  // Get edge type names
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  // Create edge map for fast lookups
  const edgeMap = createEdgeMap(nodes, nodeFields)

  // Iterate through each node and scan its edges
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const nodeEdges = getNodeEdges(nodeIndex / ITEMS_PER_NODE, edgeMap, nodes, edges, nodeFields, edgeFields)

    // Scan this node's edges
    for (const edge of nodeEdges) {
      // Check if it's a property edge with the target property name
      if (edge.type === EDGE_TYPE_PROPERTY && edge.nameIndex === propertyNameIndex) {
        // Parse the source node (the object that has the property)
        const sourceNode = parseNode(nodeIndex / ITEMS_PER_NODE, nodes, nodeFields)
        // Parse the target node (the property value)
        // Edge toNode values are array indices, need to convert to node index by dividing by ITEMS_PER_NODE
        const targetNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
        const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)

        if (sourceNode && targetNode) {
          const result: ObjectWithProperty = {
            id: sourceNode.id,
            name: getNodeName(sourceNode, strings),
            propertyValue: null,
            type: getNodeTypeName(sourceNode, nodeTypes),
            selfSize: sourceNode.self_size,
            edgeCount: sourceNode.edge_count,
          }

          // Try enhanced boolean detection first
          const booleanStructure = getBooleanStructure(sourceNode, snapshot, edgeMap, propertyName)
          if (booleanStructure) {
            // This is a boolean with the dual-reference pattern - return actual boolean value
            if (booleanStructure.value === 'true') {
              result.propertyValue = true
            } else if (booleanStructure.value === 'false') {
              result.propertyValue = false
            } else {
              result.propertyValue = booleanStructure.value
            }
          } else {
            // Fall back to standard value detection
            const actualValue = getActualValue(targetNode, snapshot, edgeMap)
            const targetTypeName = getNodeTypeName(targetNode, nodeTypes)
            // Normalize booleans and numbers
            if (actualValue === 'true') {
              result.propertyValue = true
            } else if (actualValue === 'false') {
              result.propertyValue = false
            } else if (targetTypeName === 'number') {
              const parsed = Number(actualValue)
              result.propertyValue = Number.isFinite(parsed) ? parsed : actualValue
            } else {
              result.propertyValue = actualValue
            }
          }

          // Collect properties if depth > 0
          if (depth > 0) {
            result.preview = collectObjectProperties(nodeIndex / ITEMS_PER_NODE, snapshot, edgeMap, depth)
          }

          results.push(result)
        }
      }
    }
  }

  return results
}
