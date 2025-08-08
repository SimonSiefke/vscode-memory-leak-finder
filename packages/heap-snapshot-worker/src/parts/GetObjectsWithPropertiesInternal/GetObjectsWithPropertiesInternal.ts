import { Snapshot } from '../Snapshot/Snapshot.ts'

export interface ObjectWithProperty {
  id: number
  name: string | null
  propertyValue: string | null
  type: string | null
  selfSize: number
  edgeCount: number
}

export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string): ObjectWithProperty[] => {
  const results: ObjectWithProperty[] = []

  const { meta } = snapshot
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

  // Helper function to parse a node from the flat array
  const parseNode = (nodeIndex: number): any => {
    const nodeStart = nodeIndex * nodeFields.length
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

  // Search for property edges with the specified property name
  for (let i = 0; i < edges.length; i += edgeFields.length) {
    if (i + 1 >= edges.length) {
      continue
    }

    const edgeType = edges[i]
    const edgeNameIndex = edges[i + 1]
    const edgeToNode = edges[i + 2]

    // Check if it's a property edge (type 2) with the target property name
    if (edgeType === 2 && edgeNameIndex === propertyNameIndex) {
      // Parse the target node (the property value)
      const targetNode = parseNode(edgeToNode)
      if (targetNode) {
        const result: ObjectWithProperty = {
          id: targetNode.id,
          name: getNodeName(targetNode),
          propertyValue: null,
          type: getNodeTypeName(targetNode),
          selfSize: targetNode.self_size,
          edgeCount: targetNode.edge_count,
        }

        // Try to get the property value based on the node type
        if (targetNode.type === 2) {
          // string
          result.propertyValue = getNodeName(targetNode)
        } else if (targetNode.type === 8) {
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

  return results
}
