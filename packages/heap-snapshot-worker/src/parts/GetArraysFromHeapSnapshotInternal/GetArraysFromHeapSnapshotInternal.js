import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.js'

export const getArraysFromHeapSnapshotInternal = (strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph) => {
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

  const arrayObjects = []
  const arrayNodeMap = new Map() // nodeDataIndex -> array object

  // First pass: find all array objects
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

        const arrayObj = {
          id,
          name,
          type: 'array',
          selfSize,
          edgeCount,
          detachedness,
          nodeDataIndex: i,
          variableNames: [],
          length: 0, // Will be calculated
        }

        arrayObjects.push(arrayObj)
        arrayNodeMap.set(i, arrayObj)
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
  let foundElementsEdges = 0

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
      if (elementCount > 0) {
        foundElementsEdges++
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Create name map to get real display names
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)

  // Sort by length (longest first) and return with real display names
  const result = arrayObjects
    .map((obj) => {
      const nameObject = nameMap[obj.id]

      // If we have variable names from property edges, use them as an array
      // Otherwise fall back to the single name from nameMap or obj.name
      let displayName
      if (obj.variableNames && obj.variableNames.length > 0) {
        // Extract unique variable names and sort them for consistent ordering
        const uniqueNames = [...new Set(obj.variableNames.map(v => v.name))].sort()
        displayName = uniqueNames
      } else {
        displayName = nameObject ? (nameObject.edgeName || nameObject.nodeName) : obj.name
      }

      return {
        id: obj.id,
        name: displayName,
        length: obj.length,
        type: obj.type,
        selfSize: obj.selfSize,
        edgeCount: obj.edgeCount,
        detachedness: obj.detachedness,
        variableNames: obj.variableNames,
      }
    })
    .sort((a, b) => b.length - a.length)

  return result
}
