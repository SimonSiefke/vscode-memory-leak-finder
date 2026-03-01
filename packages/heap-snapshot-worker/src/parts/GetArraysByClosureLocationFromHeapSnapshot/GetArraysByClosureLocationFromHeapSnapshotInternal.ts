import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { isInternalArray } from '../IsInternalArray/IsInternalArray.ts'

interface VariableName {
  readonly name: string
  readonly sourceName: string
  readonly sourceType: string
}

interface LocationInfo {
  readonly column: number
  readonly line: number
  readonly scriptId: number
  readonly sourceMapUrl: string
  readonly url: string
}

interface ArrayObj {
  readonly detachedness: number
  readonly edgeCount: number
  readonly id: number
  length: number
  readonly locationInfo: LocationInfo | null
  readonly locationKey: string
  readonly name: string
  readonly nodeDataIndex: number
  readonly selfSize: number
  readonly type: 'array'
  variableNames: VariableName[]
}

interface ClosureGroup {
  arrays: ArrayObj[]
  count: number
  locationInfo: LocationInfo | null
  locationKey: string
  totalSize: number
}

interface ResultArrayItem {
  readonly id: number
  readonly length: number
  readonly name: string | readonly string[]
  readonly selfSize: number
}

export interface ResultGroup {
  readonly arrays: readonly ResultArrayItem[]
  readonly avgLength: number
  readonly avgSize: number
  readonly count: number
  readonly locationInfo: LocationInfo | null
  readonly locationKey: string
  readonly totalLength: number
  readonly totalSize: number
}

interface ParsedNode {
  readonly id: number
  readonly name: string
  readonly type: string
}

export const getArraysByClosureLocationFromHeapSnapshotInternal = (
  strings: readonly string[],
  nodes: Uint32Array,
  node_types: readonly [readonly string[]],
  node_fields: readonly string[],
  edges: Uint32Array,
  edge_types: readonly [readonly string[]],
  edge_fields: readonly string[],
  parsedNodes: readonly ParsedNode[],
  locations: Uint32Array,
  locationFields: readonly string[],
  scriptMap: Record<string, unknown>,
): readonly ResultGroup[] => {
  const {
    detachednessFieldIndex,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypeFieldIndex,
    edgeTypes,
    idFieldIndex,
    ITEMS_PER_EDGE,
    ITEMS_PER_NODE,
    nameFieldIndex,
    nodeTypes,
    objectTypeIndex,
    selfSizeFieldIndex,
    traceNodeIdFieldIndex,
    typeFieldIndex,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  // Get location field offsets
  const { columnOffset, itemsPerLocation, lineOffset, scriptIdOffset } = getLocationFieldOffsets(locationFields)

  const arrayObjects: ArrayObj[] = []
  const arrayNodeMap = new Map<number, ArrayObj>() // nodeDataIndex -> array object
  const closureLocationMap = new Map<string, ClosureGroup>() // locationKey -> group

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
        let locationKey: string = 'unknown'
        let locationInfo: LocationInfo | null = null

        if (traceNodeId !== undefined && traceNodeId !== 0) {
          // Find the location in the locations array
          for (let locIndex = 0; locIndex < locations.length; locIndex += itemsPerLocation) {
            const objectIndex = locations[locIndex] / ITEMS_PER_NODE
            if (objectIndex === traceNodeId) {
              const scriptId = locations[locIndex + scriptIdOffset]
              const line = locations[locIndex + lineOffset]
              const column = locations[locIndex + columnOffset]
              locationKey = getLocationKey(scriptId, line, column)

              const script = scriptMap[scriptId] as { readonly url?: string; readonly sourceMapUrl?: string } | undefined
              locationInfo = {
                column,
                line,
                scriptId,
                sourceMapUrl: script?.sourceMapUrl || '',
                url: script?.url || '',
              }
              break
            }
          }
        }

        const arrayObj: ArrayObj = {
          detachedness,
          edgeCount,
          id,
          length: 0, // Will be calculated
          locationInfo,
          locationKey,
          name,
          nodeDataIndex: i,
          selfSize,
          type: 'array',
          variableNames: [],
        }

        arrayObjects.push(arrayObj)
        arrayNodeMap.set(i, arrayObj)

        // Group by closure location
        if (!closureLocationMap.has(locationKey)) {
          closureLocationMap.set(locationKey, {
            arrays: [],
            count: 0,
            locationInfo,
            locationKey,
            totalSize: 0,
          })
        }

        const closureGroup = closureLocationMap.get(locationKey) as ClosureGroup
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
            sourceName: sourceName,
            sourceType: sourceTypeName,
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
  const result: ResultGroup[] = [...closureLocationMap.values()]
    .map((closureGroup) => {
      // Calculate additional metrics for memory leak detection
      const avgSize = closureGroup.totalSize / closureGroup.count
      const totalLength = closureGroup.arrays.reduce((sum, arr) => sum + arr.length, 0)
      const avgLength = totalLength / closureGroup.count

      // Filter out internal arrays
      const nonInternalArrays = closureGroup.arrays.filter((arr) => {
        if (arr.variableNames && arr.variableNames.length > 0) {
          const uniqueNames = [...new Set(arr.variableNames.map((v) => v.name))]
          return !isInternalArray(uniqueNames.length === 1 ? uniqueNames[0] : uniqueNames)
        }
        return !isInternalArray(arr.name)
      })

      return {
        arrays: nonInternalArrays.map((arr) => ({
          id: arr.id,
          length: arr.length,
          name: arr.variableNames && arr.variableNames.length > 0 ? [...new Set(arr.variableNames.map((v) => v.name))].sort() : arr.name,
          selfSize: arr.selfSize,
        })),
        avgLength,
        avgSize,
        count: nonInternalArrays.length,
        locationInfo: closureGroup.locationInfo,
        locationKey: closureGroup.locationKey,
        totalLength,
        totalSize: nonInternalArrays.reduce((sum, arr) => sum + arr.selfSize, 0),
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
