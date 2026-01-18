import type { Snapshot } from '../Snapshot/Snapshot.ts'
import * as Assert from '../Assert/Assert.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { isChromeInternalArrayName } from '../IsChromeInternalArrayName/IsChromeInternalArrayName.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

const getSortedCounts = (heapsnapshot: Snapshot) => {
  const { edges, nodes, strings } = heapsnapshot
  const { meta } = heapsnapshot
  const { edge_fields, edge_types, node_fields } = meta

  const nodeFieldCount = node_fields.length
  const edgeFieldCount = edge_fields.length
  const nameFieldIndex = node_fields.indexOf('name')
  const typeFieldIndex = node_fields.indexOf('type')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
  const traceNodeIdFieldIndex = node_fields.indexOf('trace_node_id')
  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')
  const edgeTypes = edge_types[0] || []
  const nodeTypes = meta.node_types[0] || []
  const nodeTypeObject = nodeTypes.indexOf('object')

  // Get location field offsets if locations are available
  const locationFields = meta.location_fields || []
  const hasLocations = locationFields.length > 0 && heapsnapshot.locations && heapsnapshot.locations.length > 0
  const locationOffsets = hasLocations ? getLocationFieldOffsets(locationFields) : null
  const locations = hasLocations ? heapsnapshot.locations : null

  // First pass: find all Array nodes and store their byte offsets
  const arrayNodeOffsets = new Set<number>()
  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const typeIndex = nodes[i + typeFieldIndex]
    const nameIndex = nodes[i + nameFieldIndex]
    const name = strings[nameIndex]
    if (typeIndex === nodeTypeObject && name === 'Array') {
      arrayNodeOffsets.add(i)
    }
  }

  // Second pass: scan all edges to find edges pointing TO array nodes
  // Collect ALL edge names for each array, including source node context for better identification
  // CreateNameMap processes ALL edge types, not just property edges
  const arrayNamesMap = Object.create(null) // arrayNodeOffset -> Set of full names (sourceNodeName/edgeName or edgeName)
  const edgeMap = createEdgeMap(nodes, node_fields)
  const edgeTypeElement = edgeTypes.indexOf('element')

  // Initialize sets for all array nodes
  for (const arrayOffset of arrayNodeOffsets) {
    arrayNamesMap[arrayOffset] = new Set<string>()
  }

  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += nodeFieldCount) {
    const nodeIndex = nodeOffset / nodeFieldCount
    const edgeCount = nodes[nodeOffset + edgeCountFieldIndex]
    const edgeStartIndex = edgeMap[nodeIndex]

    // Get source node name for context
    const sourceNodeNameIndex = nodes[nodeOffset + nameFieldIndex]
    const sourceNodeTypeIndex = nodes[nodeOffset + typeFieldIndex]
    const sourceNodeName = sourceNodeNameIndex >= 0 && sourceNodeNameIndex < strings.length ? strings[sourceNodeNameIndex] : null
    const sourceNodeType = sourceNodeTypeIndex >= 0 && sourceNodeTypeIndex < nodeTypes.length ? nodeTypes[sourceNodeTypeIndex] : null

    // Only include source node name if it's an object (not Array, not primitive types)
    const includeSourceName =
      sourceNodeName &&
      sourceNodeType === 'object' &&
      sourceNodeName !== 'Array' &&
      sourceNodeName !== 'Object' &&
      !sourceNodeName.startsWith('<') &&
      sourceNodeName !== ''

    // Scan edges from this node
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (edgeStartIndex + j) * edgeFieldCount
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this edge points to an array node (process ALL edge types, not just property)
      // edgeToNode is a byte offset in the nodes array
      if (arrayNodeOffsets.has(edgeToNode)) {
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        let edgeName: string | null = null

        // For element edges, skip (they have numeric indices which aren't useful names)
        if (edgeType === edgeTypeElement) {
          continue
        }

        // For other edge types, get the name from strings array
        // edgeNameOrIndex is a string index for non-element edges
        if (edgeNameOrIndex >= 0 && edgeNameOrIndex < strings.length) {
          const potentialName = strings[edgeNameOrIndex]
          // Only use if it's a non-empty string (not a number or other type)
          if (typeof potentialName === 'string' && potentialName !== '') {
            edgeName = potentialName
          }
        }

        // Filter out internal properties (but allow other edge types through)
        if (
          edgeName &&
          edgeName !== 'constructor' &&
          edgeName !== '__proto__' &&
          edgeName !== 'prototype' &&
          !edgeName.startsWith('<symbol')
        ) {
          // Build full name: include source node name if available and meaningful
          const fullName = includeSourceName ? `${sourceNodeName}.${edgeName}` : edgeName
          arrayNamesMap[edgeToNode].add(fullName)
        }
      }
    }
  }

  // Count arrays by joined names (one count per array, not per edge)
  // Join all names with "/" to differentiate arrays with the same name
  // Also collect location info for potential original name resolution
  const nameMap = Object.create(null) // joinedName -> { count, locations: Set<string> }
  for (const arrayOffset of arrayNodeOffsets) {
    const edgeNames = arrayNamesMap[arrayOffset]
    if (edgeNames.size > 0) {
      // Sort names for consistent ordering, then join with "/"
      const sortedNames = [...edgeNames].sort()
      const joinedName = sortedNames.join('/')

      // Try to get location info for this array (for potential original name resolution)
      let locationKey: string | null = null
      if (hasLocations && locationOffsets && locations && traceNodeIdFieldIndex !== -1) {
        const traceNodeId = nodes[arrayOffset + traceNodeIdFieldIndex]
        if (traceNodeId !== undefined && traceNodeId !== 0) {
          // Find the location in the locations array
          for (let locIndex = 0; locIndex < locations.length; locIndex += locationOffsets.itemsPerLocation) {
            const objectIndex = locations[locIndex + locationOffsets.objectIndexOffset] / nodeFieldCount
            if (objectIndex === traceNodeId) {
              const scriptId = locations[locIndex + locationOffsets.scriptIdOffset]
              const line = locations[locIndex + locationOffsets.lineOffset]
              const column = locations[locIndex + locationOffsets.columnOffset]
              locationKey = `${scriptId}:${line}:${column}`
              break
            }
          }
        }
      }

      if (!nameMap[joinedName]) {
        nameMap[joinedName] = {
          count: 0,
          locations: new Set<string>(),
        }
      }
      nameMap[joinedName].count++
      if (locationKey) {
        nameMap[joinedName].locations.add(locationKey)
      }
    }
  }

  const arrayNamesWithCount = Object.entries(nameMap)
    .filter(([name]) => !isChromeInternalArrayName(name))
    .map(([key, value]) => {
      return {
        // @ts-ignore
        count: value.count,
        name: key,
      }
    })
  const sorted = SortCountMap.sortCountMap(arrayNamesWithCount)
  return sorted
}

interface CountItem {
  readonly count: number
}

const compareItem = (a: CountItem, b: CountItem): number => {
  return b.count - a.count
}

const sortByCounts = <T extends CountItem>(items: readonly T[]): readonly T[] => {
  Assert.array(items)
  const sorted = items.toSorted(compareItem)
  return sorted
}

interface ArrayCountItem extends CountItem {
  readonly name: string
}

interface LeakedArrayItem extends ArrayCountItem {
  readonly delta: number
}

const compareCounts = (
  before: readonly ArrayCountItem[],
  after: readonly ArrayCountItem[],
): readonly LeakedArrayItem[] => {
  const beforeMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const leaked: LeakedArrayItem[] = []
  for (const item of after) {
    const oldCount = beforeMap[item.name] || 0
    const afterCount = item.count
    const delta = afterCount - oldCount
    if (delta > 0) {
      leaked.push({
        ...item,
        delta,
      })
    }
  }
  const sorted = sortByCounts(leaked)
  return sorted
}

export const compareHeapsnapshotArraysInternal2 = async (snapshotA: Snapshot, snapshotB: Snapshot) => {
  Assert.object(snapshotA)
  Assert.object(snapshotB)
  const countsA = getSortedCounts(snapshotA)
  const countsB = getSortedCounts(snapshotB)
  const result = compareCounts(countsA, countsB)
  return result
}
