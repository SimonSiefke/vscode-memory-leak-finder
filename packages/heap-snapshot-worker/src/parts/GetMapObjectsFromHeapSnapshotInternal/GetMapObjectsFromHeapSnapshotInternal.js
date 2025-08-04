import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'

/**
 * @param {Array} strings
 * @param {Uint32Array} nodes
 * @param {Array} node_types
 * @param {Array} node_fields
 * @param {Uint32Array} edges
 * @param {Array} edge_types
 * @param {Array} edge_fields
 * @returns {Array}
 */
export const getMapObjectsFromHeapSnapshotInternal = (strings, nodes, node_types, node_fields, edges, edge_types, edge_fields) => {
  const {
    objectTypeIndex,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    selfSizeFieldIndex,
    edgeCountFieldIndex,
    detachednessFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypes,
    nodeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  if (objectTypeIndex === -1) {
    return []
  }

  // First pass: collect Map objects
  const mapObjects = []
  const mapNodeMap = new Map() // nodeDataIndex -> map object

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const name = strings[nameIndex] || ''

      // Look for Map objects only
      if (name === 'Map') {
        const id = nodes[i + idFieldIndex]
        const selfSize = nodes[i + selfSizeFieldIndex]
        const edgeCount = nodes[i + edgeCountFieldIndex]
        const detachedness = nodes[i + detachednessFieldIndex]

        const mapObj = {
          id,
          name,
          type: 'map', // Only Map objects
          selfSize,
          edgeCount,
          detachedness,
          nodeDataIndex: i, // Store node data index for later use
          variableNames: [], // Will be populated by scanning edges
          entries: [], // Will be populated by extracting from table array
          size: null, // Will try to extract from internal structure
          note: 'Map object found in heap snapshot',
        }

        mapObjects.push(mapObj)
        mapNodeMap.set(i, mapObj) // Map nodeDataIndex to object
      }
    }
  }

  // Second pass: find variable names by scanning edges that reference map objects
  let currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

    // Scan this node's edges
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this edge points to a map object
      const mapObj = mapNodeMap.get(edgeToNode)
      if (mapObj) {
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

        let edgeName = ''
        if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
        } else {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
        }

        // Get source node info
        const sourceTypeIndex = nodes[nodeIndex + typeFieldIndex]
        const sourceNameIndex = nodes[nodeIndex + nameFieldIndex]
        const sourceTypeName = nodeTypes[sourceTypeIndex] || `type_${sourceTypeIndex}`
        const sourceName = strings[sourceNameIndex] || `<string_${sourceNameIndex}>`

        // Collect variable names from property edges, excluding prototypes and internal properties
        if (
          edgeTypeName === 'property' &&
          edgeName !== 'constructor' &&
          edgeName !== '__proto__' &&
          edgeName !== 'prototype' &&
          !edgeName.startsWith('<symbol')
        ) {
          mapObj.variableNames.push({
            name: edgeName,
            sourceType: sourceTypeName,
            sourceName: sourceName,
          })
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Third pass: try to extract size information from Map objects' internal edges
  currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    const mapObj = mapNodeMap.get(nodeIndex)

    if (mapObj) {
      // Scan this Map's own edges to find size information
      for (let j = 0; j < edgeCount; j++) {
        const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

        let edgeName = ''
        if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
        } else {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
        }

        // Look for size-related properties
        if (edgeName === 'size' && mapObj.type === 'map') {
          // For Map, try to get actual size if possible
          // Note: The actual size value is complex to extract from AccessorPair
          mapObj.size = 'dynamic' // Placeholder - actual runtime size not directly accessible
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Third pass: extract Map entries from table arrays
  for (const mapObj of mapObjects) {
    // Find the table array for this Map
    let mapEdgeOffset = 0
    for (let nodeIndex = 0; nodeIndex < mapObj.nodeDataIndex; nodeIndex += ITEMS_PER_NODE) {
      mapEdgeOffset += nodes[nodeIndex + edgeCountFieldIndex]
    }

    let tableArrayNodeIndex = null

    // Look for the "table" internal edge
    for (let j = 0; j < mapObj.edgeCount; j++) {
      const edgeIndex = (mapEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`
      const edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`

      if (edgeTypeName === 'internal' && edgeName === 'table') {
        tableArrayNodeIndex = edgeToNode
        break
      }
    }

    if (!tableArrayNodeIndex) {
      continue // Skip if no table array found
    }

    // Extract entries from table array
    const tableEdgeCount = nodes[tableArrayNodeIndex + edgeCountFieldIndex]

    let tableEdgeOffset = 0
    for (let nodeIndex = 0; nodeIndex < tableArrayNodeIndex; nodeIndex += ITEMS_PER_NODE) {
      tableEdgeOffset += nodes[nodeIndex + edgeCountFieldIndex]
    }

    const entries = []

    // Collect data entries from table array
    for (let j = 0; j < tableEdgeCount; j++) {
      const edgeIndex = (tableEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

      // Get target info
      const targetType = nodes[edgeToNode + typeFieldIndex]
      const targetName = strings[nodes[edgeToNode + nameFieldIndex]] || ''
      const targetTypeName = nodeTypes[targetType] || `type_${targetType}`

      // Only collect meaningful entries (strings and numbers, not system objects)
      if (edgeTypeName === 'internal' && (targetTypeName === 'string' || targetTypeName === 'number') && targetName) {
        entries.push({
          type: targetTypeName,
          value: targetName
        })
      }
    }

    // Pair entries as key-value pairs (even indices = keys, odd indices = values)
    for (let i = 0; i < entries.length - 1; i += 2) {
      const key = entries[i]
      const value = entries[i + 1]
      if (key && value) {
        mapObj.entries.push({
          key: key.value,
          value: value.value,
          keyType: key.type,
          valueType: value.type
        })
      }
    }

    // Update size based on number of entries
    if (mapObj.entries.length > 0) {
      mapObj.size = mapObj.entries.length
    }
  }

  // Filter out prototypes and system objects (only return Map objects with variable names)
  const namedMapObjects = mapObjects.filter((obj) => obj.variableNames.length > 0)
  
  // Remove internal fields from output
  return namedMapObjects.map(obj => ({
    id: obj.id,
    name: obj.name,
    type: obj.type,
    selfSize: obj.selfSize,
    edgeCount: obj.edgeCount,
    detachedness: obj.detachedness,
    variableNames: obj.variableNames,
    entries: obj.entries,
    size: obj.size,
    note: obj.note
  })).sort((a, b) => a.id - b.id)
}
