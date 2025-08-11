import { collectObjectProperties } from '../CollectObjectProperties/CollectObjectProperties.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getBooleanStructure } from '../GetBooleanValue/GetBooleanValue.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import type { ObjectWithProperty } from '../ObjectWithProperty/ObjectWithProperty.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

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
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const nodeEdges = getNodeEdges(nodeIndex / ITEMS_PER_NODE, edgeMap, nodes, edges, nodeFields, edgeFields)

    // Scan this node's edges
    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      const nameIndex = nodeEdges[i + edgeNameFieldIndex]
      const toNode = nodeEdges[i + edgeToNodeFieldIndex]
      // Check if it's a property edge with the target property name
      if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
        const sourceNode = parseNode(nodeIndex / ITEMS_PER_NODE, nodes, nodeFields)
        const targetNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
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

          const booleanStructure = getBooleanStructure(sourceNode, snapshot, edgeMap, propertyName)
          if (booleanStructure) {
            if (booleanStructure.value === 'true') {
              result.propertyValue = true
            } else if (booleanStructure.value === 'false') {
              result.propertyValue = false
            } else {
              result.propertyValue = booleanStructure.value
            }
          } else {
            const actualValue = getActualValue(targetNode, snapshot, edgeMap)
            const targetTypeName = getNodeTypeName(targetNode, nodeTypes)
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
