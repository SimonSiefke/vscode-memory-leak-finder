import * as Assert from '../Assert/Assert.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { isChromeInternalArrayName } from '../IsChromeInternalArrayName/IsChromeInternalArrayName.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'

const getSortedCounts = (
  heapsnapshot: Snapshot,
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }> = {},
) => {
  const { nodes, edges, strings } = heapsnapshot
  const meta = heapsnapshot.meta
  const { node_fields, edge_fields, edge_types } = meta

  const nodeFieldCount = node_fields.length
  const edgeFieldCount = edge_fields.length
  const nameFieldIndex = node_fields.indexOf('name')
  const typeFieldIndex = node_fields.indexOf('type')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
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
  // Also collect location info from closures
  const nameMap = Object.create(null) // joinedName -> { count, locations: Set<string> }
  const idFieldIndex = node_fields.indexOf('id')

  if (hasLocations && locationOffsets && locations) {
    // Find closures and their locations (for connecting arrays to closures)
    const closureLocationMap = new Map<number, string>() // closure node ID -> locationKey
    const closureNodeIndexToIdMap = new Map<number, number>() // closure node index -> closure node ID
    const nodeTypeClosure = nodeTypes.indexOf('closure')
    const edgeTypeContext = edgeTypes.indexOf('context')

    // Build reverse map: object_index -> location info (for fast lookup)
    const locationMap = new Map<number, string>() // object_index -> locationKey
    for (let locIndex = 0; locIndex < locations.length; locIndex += locationOffsets.itemsPerLocation) {
      const objectIndex = locations[locIndex + locationOffsets.objectIndexOffset] / nodeFieldCount
      const scriptId = locations[locIndex + locationOffsets.scriptIdOffset]
      const line = locations[locIndex + locationOffsets.lineOffset]
      const column = locations[locIndex + locationOffsets.columnOffset]
      const script = scriptMap[scriptId]
      // Store location key with URL if available
      const locationKey = script?.url
        ? `${script.url}:${line}:${column}`
        : getLocationKey(scriptId, line, column)
      locationMap.set(objectIndex, locationKey)
    }

    // First pass: Find all closures and their locations, build closure index->ID map
    for (let i = 0; i < nodes.length; i += nodeFieldCount) {
      const typeIndex = nodes[i + typeFieldIndex]
      if (typeIndex === nodeTypeClosure) {
        const closureNodeId = nodes[i + idFieldIndex]
        const nodeIndex = i / nodeFieldCount
        closureNodeIndexToIdMap.set(nodeIndex, closureNodeId)

        // Find location for this closure using the reverse map
        const locationKey = locationMap.get(nodeIndex)
        if (locationKey) {
          closureLocationMap.set(closureNodeId, locationKey)
        }
      }
    }
    // Build reverse map: array node ID -> set of closure IDs that reference it
    const arrayToClosuresMap = new Map<number, Set<number>>() // array node ID -> set of closure IDs
    const contextToClosureMap = new Map<number, number>() // context node index -> closure node ID
    const objectToClosureMap = new Map<number, Set<number>>() // object node index -> set of closure IDs that reference it

    // Second pass: Scan edges once to find closure->context and closure->array connections
    // Only process closure nodes to avoid scanning all nodes
    for (const [closureNodeIndex, closureNodeId] of closureNodeIndexToIdMap.entries()) {
      const closureNodeOffset = closureNodeIndex * nodeFieldCount
      const edgeCount = nodes[closureNodeOffset + edgeCountFieldIndex]
      const edgeStartIndex = edgeMap[closureNodeIndex]

      // Scan edges from this closure
      for (let j = 0; j < edgeCount; j++) {
        const edgeIndex = (edgeStartIndex + j) * edgeFieldCount
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
        const targetNodeIndex = edgeToNode / nodeFieldCount

        // Check for context edge
        if (edgeType === edgeTypeContext) {
          // Map context node to closure
          contextToClosureMap.set(targetNodeIndex, closureNodeId)
          // Also mark the context object as referenced by this closure
          if (!objectToClosureMap.has(targetNodeIndex)) {
            objectToClosureMap.set(targetNodeIndex, new Set())
          }
          objectToClosureMap.get(targetNodeIndex)!.add(closureNodeId)
        } else {
          // Direct edge from closure to array
          if (arrayNodeOffsets.has(edgeToNode)) {
            const arrayNodeId = nodes[edgeToNode + idFieldIndex]
            if (!arrayToClosuresMap.has(arrayNodeId)) {
              arrayToClosuresMap.set(arrayNodeId, new Set())
            }
            arrayToClosuresMap.get(arrayNodeId)!.add(closureNodeId)
          } else {
            // Edge to some other object - mark it as referenced by closure
            if (!objectToClosureMap.has(targetNodeIndex)) {
              objectToClosureMap.set(targetNodeIndex, new Set())
            }
            objectToClosureMap.get(targetNodeIndex)!.add(closureNodeId)
          }
        }
      }
    }
    // Third pass: Scan edges from context objects and closure-referenced objects to arrays
    // Process context objects
    for (const [contextNodeIndex, closureNodeId] of contextToClosureMap.entries()) {
      const contextNodeOffset = contextNodeIndex * nodeFieldCount
      const contextEdgeCount = nodes[contextNodeOffset + edgeCountFieldIndex]
      const contextEdgeStartIndex = edgeMap[contextNodeIndex]

      for (let k = 0; k < contextEdgeCount; k++) {
        const contextEdgeIndex = (contextEdgeStartIndex + k) * edgeFieldCount
        const contextEdgeToNode = edges[contextEdgeIndex + edgeToNodeFieldIndex]

        // Check if context edge points to an array
        if (arrayNodeOffsets.has(contextEdgeToNode)) {
          const arrayNodeId = nodes[contextEdgeToNode + idFieldIndex]
          if (!arrayToClosuresMap.has(arrayNodeId)) {
            arrayToClosuresMap.set(arrayNodeId, new Set())
          }
          arrayToClosuresMap.get(arrayNodeId)!.add(closureNodeId)
        }
      }
    }

    // Also scan edges from objects referenced by closures to arrays
    // Also propagate closure references to objects referenced by closure-referenced objects (up to 2 levels deep)
    const objectsToProcess = Array.from(objectToClosureMap.entries())
    let processedCount = 0
    const maxDepth = 2 // Limit depth to avoid performance issues

    for (let depth = 0; depth < maxDepth && processedCount < objectsToProcess.length; depth++) {
      const currentLevel = objectsToProcess.slice(processedCount)
      processedCount = objectsToProcess.length

      for (const [objectNodeIndex, closureIds] of currentLevel) {
        const objectNodeOffset = objectNodeIndex * nodeFieldCount
        const objectEdgeCount = nodes[objectNodeOffset + edgeCountFieldIndex]
        const objectEdgeStartIndex = edgeMap[objectNodeIndex]

        for (let k = 0; k < objectEdgeCount; k++) {
          const objectEdgeIndex = (objectEdgeStartIndex + k) * edgeFieldCount
          const objectEdgeToNode = edges[objectEdgeIndex + edgeToNodeFieldIndex]
          const targetNodeIndex = objectEdgeToNode / nodeFieldCount

          // Check if object edge points to an array
          if (arrayNodeOffsets.has(objectEdgeToNode)) {
            const arrayNodeId = nodes[objectEdgeToNode + idFieldIndex]
            if (!arrayToClosuresMap.has(arrayNodeId)) {
              arrayToClosuresMap.set(arrayNodeId, new Set())
            }
            // Add all closures that reference this object
            for (const closureId of closureIds) {
              arrayToClosuresMap.get(arrayNodeId)!.add(closureId)
            }
          } else {
            // Also propagate closure references to other objects (for next depth level)
            // Only add if it's an object type (not array, string, closure, etc.)
            const targetTypeIndex = nodes[objectEdgeToNode + typeFieldIndex]
            if (
              targetTypeIndex === nodeTypeObject &&
              targetTypeIndex !== nodeTypeClosure &&
              !objectToClosureMap.has(targetNodeIndex)
            ) {
              objectToClosureMap.set(targetNodeIndex, new Set(closureIds))
              objectsToProcess.push([targetNodeIndex, closureIds])
            }
          }
        }
      }
    }

    // Fourth pass: Scan ALL edges pointing TO arrays and check if source is referenced by closure
    // This catches arrays referenced through multiple levels of indirection
    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx += nodeFieldCount) {
      const sourceNodeIndex = nodeIdx / nodeFieldCount
      const edgeCount = nodes[nodeIdx + edgeCountFieldIndex]
      const edgeStartIndex = edgeMap[sourceNodeIndex]

      // Check if source node is referenced by a closure
      const sourceClosureIds = objectToClosureMap.get(sourceNodeIndex)
      if (sourceClosureIds && sourceClosureIds.size > 0) {
        for (let j = 0; j < edgeCount; j++) {
          const edgeIndex = (edgeStartIndex + j) * edgeFieldCount
          const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

          // Check if this edge points to an array
          if (arrayNodeOffsets.has(edgeToNode)) {
            const arrayNodeId = nodes[edgeToNode + idFieldIndex]
            if (!arrayToClosuresMap.has(arrayNodeId)) {
              arrayToClosuresMap.set(arrayNodeId, new Set())
            }
            // Add all closures that reference the source object
            for (const closureId of sourceClosureIds) {
              arrayToClosuresMap.get(arrayNodeId)!.add(closureId)
            }
          }
        }
      }
    }

    // Count arrays by joined names and collect locations from closures
    for (const arrayOffset of arrayNodeOffsets) {
      const edgeNames = arrayNamesMap[arrayOffset]
      if (edgeNames.size > 0) {
        // Sort names for consistent ordering, then join with "/"
        const sortedNames = Array.from(edgeNames).sort()
        const joinedName = sortedNames.join('/')

        // Find which closures reference this array
        const arrayNodeId = nodes[arrayOffset + idFieldIndex]
        const locationKeys = new Set<string>()

        // Get closures that reference this array
        const closureIds = arrayToClosuresMap.get(arrayNodeId)
        if (closureIds) {
          for (const closureId of closureIds) {
            const locationKey = closureLocationMap.get(closureId)
            if (locationKey) {
              locationKeys.add(locationKey)
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
        for (const locationKey of locationKeys) {
          nameMap[joinedName].locations.add(locationKey)
        }
      }
    }
  } else {
    // Fallback: no locations available
    for (const arrayOffset of arrayNodeOffsets) {
      const edgeNames = arrayNamesMap[arrayOffset]
      if (edgeNames.size > 0) {
        // Sort names for consistent ordering, then join with "/"
        const sortedNames = Array.from(edgeNames).sort()
        const joinedName = sortedNames.join('/')

        if (!nameMap[joinedName]) {
          nameMap[joinedName] = {
            count: 0,
            locations: new Set<string>(),
          }
        }
        nameMap[joinedName].count++
      }
    }
  }

  const arrayNamesWithCount = Object.entries(nameMap)
    .filter(([name]) => !isChromeInternalArrayName(name))
    .map(([key, value]) => {
      // @ts-ignore
      const locationKeys = Array.from(value.locations || [])
      // Parse location keys to enrich with script info
      const enrichedLocations = locationKeys.map((locationKey: string) => {
        // Check if it's already enriched with URL (format: "url:line:column")
        if (locationKey.includes('://') || locationKey.startsWith('file://')) {
          return locationKey
        }
        // Otherwise it's in format "scriptId:line:column"
        const parts = locationKey.split(':')
        if (parts.length === 3) {
          const scriptId = Number(parts[0])
          const line = parts[1]
          const column = parts[2]
          const script = scriptMap[scriptId]
          if (script?.url) {
            return `${script.url}:${line}:${column}`
          }
        }
        return locationKey
      })
      return {
        name: key,
        // @ts-ignore
        count: value.count,
        locations: enrichedLocations,
      }
    })
  const sorted = SortCountMap.sortCountMap(arrayNamesWithCount)
  return sorted
}

const compareItem = (a, b) => {
  return b.count - a.count
}

const sortByCounts = (items: readonly any[]) => {
  Assert.array(items)
  const sorted = items.toSorted(compareItem)
  return sorted
}

const compareCounts = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.name] ||= 0
    beforeMap[item.name] += item.count
  }
  const leaked: any[] = []
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

export const compareHeapsnapshotArraysInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }> = {},
) => {
  Assert.object(snapshotA)
  Assert.object(snapshotB)
  const countsA = getSortedCounts(snapshotA, scriptMap)
  const countsB = getSortedCounts(snapshotB, scriptMap)
  const result = compareCounts(countsA, countsB)
  return result
}
