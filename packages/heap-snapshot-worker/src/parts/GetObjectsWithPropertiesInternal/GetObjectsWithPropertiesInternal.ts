import type { Snapshot } from '../Snapshot/Snapshot.js'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'

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

          // Get the actual value by following references
          result.propertyValue = getActualValue(targetNode, snapshot, edgeMap)

          results.push(result)
        }
      }
    }
  }

  return results
}
