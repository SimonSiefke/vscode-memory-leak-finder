import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { isInternalMap } from '../IsInternalMap/IsInternalMap.js'

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
          variableNames: /** @type {Array<{name: string, sourceType: string, sourceName: string}>} */ ([]), // Will be populated by scanning edges
          keys: /** @type {string[]} */ ([]), // Will be populated by extracting from table array
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
        if (isInternalMap(edgeTypeName, edgeName)) {
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

  // Third pass: extract Map keys from table arrays
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

    // Extract keys from table array
    const tableEdgeCount = nodes[tableArrayNodeIndex + edgeCountFieldIndex]

    let tableEdgeOffset = 0
    for (let nodeIndex = 0; nodeIndex < tableArrayNodeIndex; nodeIndex += ITEMS_PER_NODE) {
      tableEdgeOffset += nodes[nodeIndex + edgeCountFieldIndex]
    }

        // Collect keys from table array
    // Map stores key-value pairs, but we need to identify which entries are keys vs values
    // Based on analysis, it appears the table may not be stored in strict alternating pattern
    // We need a different approach to distinguish keys from values

    // For now, let's use a heuristic: collect unique string values and known large numbers
    // that are likely to be keys rather than common small values
    const extractedValues = []
    const actualKeyEdges = Math.max(0, tableEdgeCount - 1)

    for (let j = 0; j < actualKeyEdges; j++) {
      const edgeIndex = (tableEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

      // Get target info
      const targetType = nodes[edgeToNode + typeFieldIndex]
      const targetNameIndex = nodes[edgeToNode + nameFieldIndex]
      const targetName = strings[targetNameIndex] || ''
      const targetTypeName = nodeTypes[targetType] || `type_${targetType}`

      if (edgeTypeName === 'internal' && targetName && targetName !== 'system / Map' && !targetName.startsWith('system')) {
        if (targetTypeName === 'string') {
          // String values - these could be keys or values
          extractedValues.push({ value: targetName, type: 'string', isLikelyKey: true })
        } else if (targetTypeName === 'number' && targetName === 'heap number') {
          // Numeric value - follow the first edge to get the actual string representation
          const numEdgeCount = nodes[edgeToNode + edgeCountFieldIndex]
          if (numEdgeCount > 0) {
            let numEdgeOffset = 0
            for (let nodeIndex = 0; nodeIndex < edgeToNode; nodeIndex += ITEMS_PER_NODE) {
              numEdgeOffset += nodes[nodeIndex + edgeCountFieldIndex]
            }

            // Get the first edge (should point to the string representation)
            const firstEdgeIndex = numEdgeOffset * ITEMS_PER_EDGE
            const firstEdgeToNode = edges[firstEdgeIndex + edgeToNodeFieldIndex]
            const actualNumericValue = strings[nodes[firstEdgeToNode + nameFieldIndex]] || ''

            if (actualNumericValue && actualNumericValue !== 'system / Map') {
              // Heuristic: large numbers (>1000) are more likely to be keys than small values
              const numValue = parseInt(actualNumericValue, 10)
              const isLikelyKey = isNaN(numValue) || numValue > 1000 || actualNumericValue.length > 3
              extractedValues.push({ value: actualNumericValue, type: 'number', isLikelyKey })
            }
          }
        }
      }
    }

    // Add likely keys to the keys array
    for (const item of extractedValues) {
      if (item.isLikelyKey) {
        mapObj.keys.push(item.value)
      }
    }
  }

  // Filter out prototypes and system objects (only return Map objects with variable names)
  const namedMapObjects = mapObjects.filter((obj) => obj.variableNames.length > 0)

  // Remove internal fields from output
  return namedMapObjects
    .map((obj) => {
      const names = obj.variableNames.map((v) => v.name)
      let nameField

      if (names.length === 1) {
        nameField = names[0]
      } else {
        nameField = names
      }

      return {
        id: obj.id,
        name: nameField,
        keys: obj.keys,
        note: obj.keys.length > 0 ? `Map object with ${obj.keys.length} keys (values not accessible)` : 'Map object found in heap snapshot',
      }
    })
    .sort((a, b) => a.id - b.id)
}
