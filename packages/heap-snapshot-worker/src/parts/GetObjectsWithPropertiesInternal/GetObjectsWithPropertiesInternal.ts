import type { Snapshot } from '../Snapshot/Snapshot.js'

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
    if (node.name !== undefined && strings[node.name]) {
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

  // Iterate through each node and scan its edges
  let currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

    // Scan this node's edges
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if it's a property edge (type 2) with the target property name
      if (edgeType === 2 && edgeNameIndex === propertyNameIndex) {
        // Parse the source node (the object that has the property)
        const sourceNode = parseNode(nodeIndex / ITEMS_PER_NODE)
        // Parse the target node (the property value)
        const targetNode = parseNode(edgeToNode)

        if (sourceNode && targetNode) {
          const result: ObjectWithProperty = {
            id: sourceNode.id,
            name: getNodeName(sourceNode),
            propertyValue: null,
            type: getNodeTypeName(sourceNode),
            selfSize: sourceNode.self_size,
            edgeCount: sourceNode.edge_count,
          }

          // Try to get the property value based on the target node type
          if (targetNode.type === 2) {
            // string
            result.propertyValue = getNodeName(targetNode)
          } else if (targetNode.type === 7) {
            // number
            result.propertyValue = targetNode.name?.toString() || null // name field contains the number value
          } else if (targetNode.type === 3) {
            // object
            result.propertyValue = `[Object ${targetNode.id}]`
          } else if (targetNode.type === 1) {
            // array
            result.propertyValue = `[Array ${targetNode.id}]`
          } else {
            const typeName = getNodeTypeName(targetNode)
            result.propertyValue = `[${typeName || 'Unknown'} ${targetNode.id}]`
          }

          results.push(result)
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  return results
}
