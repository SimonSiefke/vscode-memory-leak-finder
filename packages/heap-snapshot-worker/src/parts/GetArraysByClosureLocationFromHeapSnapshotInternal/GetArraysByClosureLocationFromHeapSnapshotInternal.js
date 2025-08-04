import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import { isInternalArray } from '../IsInternalArray/IsInternalArray.js'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.js'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

export const getArraysByClosureLocationFromHeapSnapshotInternal = (
  strings,
  nodes,
  node_types,
  node_fields,
  edges,
  edge_types,
  edge_fields,
  parsedNodes,
  locations,
  locationFields,
  scriptMap,
) => {
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
    traceNodeIdFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypes,
    nodeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  // Get location field offsets
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)

  const arrayObjects = []
  const arrayNodeMap = new Map() // nodeDataIndex -> array object
  const closureLocationMap = new Map() // locationKey -> { arrays: [], totalSize: 0, count: 0 }

  // First pass: find all array objects and their locations
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const name = strings[nameIndex] || ''

      // Look for Array objects only
      if (name === 'Array') {
        const id = nodes[i + idFieldIndex]
        const selfSize = nodes[i + selfSizeFieldIndex]
        const edgeCount = nodes[i + edgeCountFieldIndex]
        const detachedness = nodes[i + detachednessFieldIndex]
        const traceNodeId = nodes[i + traceNodeIdFieldIndex]

        // Find the location for this array
        let locationKey = 'unknown'
        let locationInfo = null

        if (traceNodeId !== undefined && traceNodeId !== 0) {
          // Find the location in the locations array
          for (let locIndex = 0; locIndex < locations.length; locIndex += itemsPerLocation) {
            const objectIndex = locations[locIndex] / ITEMS_PER_NODE
            if (objectIndex === traceNodeId) {
              const scriptId = locations[locIndex + scriptIdOffset]
              const line = locations[locIndex + lineOffset]
              const column = locations[locIndex + columnOffset]
              locationKey = getLocationKey(scriptId, line, column)
              
              const script = scriptMap[scriptId]
              locationInfo = {
                scriptId,
                line,
                column,
                url: script?.url || '',
                sourceMapUrl: script?.sourceMapUrl || '',
              }
              break
            }
          }
        }

        const arrayObj = {
          id,
          name,
          type: 'array',
          selfSize,
          edgeCount,
          detachedness,
          nodeDataIndex: i,
          locationKey,
          locationInfo,
          variableNames: [],
          length: 0, // Will be calculated
        }

        arrayObjects.push(arrayObj)
        arrayNodeMap.set(i, arrayObj)

        // Group by closure location
        if (!closureLocationMap.has(locationKey)) {
          closureLocationMap.set(locationKey, {
            locationKey,
            locationInfo,
            arrays: [],
            totalSize: 0,
            count: 0,
          })
        }

        const closureGroup = closureLocationMap.get(locationKey)
        closureGroup.arrays.push(arrayObj)
        closureGroup.totalSize += selfSize
        closureGroup.count++
      }
    }
  }

  // Second pass: find variable names by scanning edges that reference array objects
  let currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

    // Scan this node's edges
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this edge points to an array object
      const arrayObj = arrayNodeMap.get(edgeToNode)
      if (arrayObj) {
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
          arrayObj.variableNames.push({
            name: edgeName,
            sourceType: sourceTypeName,
            sourceName: sourceName,
          })
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Third pass: calculate array lengths by counting element edges directly on array nodes
  currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    const arrayObj = arrayNodeMap.get(nodeIndex)

    if (arrayObj) {
      // Count the 'element' edges directly on this array node
      let elementCount = 0
      for (let j = 0; j < edgeCount; j++) {
        const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

        if (edgeTypeName === 'element') {
          elementCount++
        }
      }

      arrayObj.length = elementCount
    }

    currentEdgeOffset += edgeCount
  }

  // Convert closure location map to array and sort by potential memory leak indicators
  const result = Array.from(closureLocationMap.values())
    .map((closureGroup) => {
      // Calculate additional metrics for memory leak detection
      const avgSize = closureGroup.totalSize / closureGroup.count
      const totalLength = closureGroup.arrays.reduce((sum, arr) => sum + arr.length, 0)
      const avgLength = totalLength / closureGroup.count

      // Filter out internal arrays
      const nonInternalArrays = closureGroup.arrays.filter((arr) => {
        if (arr.variableNames && arr.variableNames.length > 0) {
          const uniqueNames = [...new Set(arr.variableNames.map(v => v.name))]
          return !isInternalArray(uniqueNames.length === 1 ? uniqueNames[0] : uniqueNames)
        }
        return !isInternalArray(arr.name)
      })

      return {
        locationKey: closureGroup.locationKey,
        locationInfo: closureGroup.locationInfo,
        count: nonInternalArrays.length,
        totalSize: nonInternalArrays.reduce((sum, arr) => sum + arr.selfSize, 0),
        avgSize,
        totalLength,
        avgLength,
        arrays: nonInternalArrays.map((arr) => ({
          id: arr.id,
          name: arr.variableNames && arr.variableNames.length > 0 
            ? [...new Set(arr.variableNames.map(v => v.name))].sort()
            : arr.name,
          length: arr.length,
          selfSize: arr.selfSize,
        })),
      }
    })
    .filter((group) => group.count > 0) // Only include groups with non-internal arrays
    .sort((a, b) => {
      // Sort by multiple factors to identify potential memory leaks:
      // 1. Number of arrays (more arrays = higher risk)
      // 2. Total size (larger total = higher risk)
      // 3. Average size (larger average = higher risk)
      if (a.count !== b.count) {
        return b.count - a.count
      }
      if (a.totalSize !== b.totalSize) {
        return b.totalSize - a.totalSize
      }
      return b.avgSize - a.avgSize
    })

  return result
} 