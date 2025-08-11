import { collectArrayElements } from '../CollectArrayElements/CollectArrayElements.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { tryResolveNestedNumeric } from '../TryResolveNestedNumeric/TryResolveNestedNumeric.ts'

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
      } else if (targetType === 'closure') {
        // Prefer showing function location if available
        const locationFields = snapshot.meta.location_fields
        const locations = snapshot.locations
        if (locationFields && locationFields.length > 0 && locations && locations.length > 0) {
          const { itemsPerLocation, objectIndexOffset, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)
          const traceNodeId = (targetNode as any)['trace_node_id']
          for (let locIndex = 0; locIndex < locations.length; locIndex += itemsPerLocation) {
            const objectIndex = locations[locIndex + objectIndexOffset] / ITEMS_PER_NODE
            const isMatchByTrace = typeof traceNodeId === 'number' && traceNodeId !== 0 && objectIndex === traceNodeId
            const isMatchByNodeIndex = objectIndex === targetNodeIndex
            if (isMatchByTrace || isMatchByNodeIndex) {
              const scriptId = locations[locIndex + scriptIdOffset]
              const line = locations[locIndex + lineOffset]
              const column = locations[locIndex + columnOffset]
              value = `[function: ${scriptId}:${line}:${column}]`
              break
            }
          }
        }
        if (value === undefined) {
          value = `[${targetType} ${targetNode.id}]`
        }
      } else {
        // For other types
        value = `[${targetType} ${targetNode.id}]`
      }

      // Heuristic: For coordinate and size properties ('x','y','width','height'),
      // if value still looks like a reference, try to resolve nested numeric value
      if (
        (propertyName === 'x' || propertyName === 'y' || propertyName === 'width' || propertyName === 'height') &&
        typeof value === 'string' &&
        value.startsWith('[')
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
