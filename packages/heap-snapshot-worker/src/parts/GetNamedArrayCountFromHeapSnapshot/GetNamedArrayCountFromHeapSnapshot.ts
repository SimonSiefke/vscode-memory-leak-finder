import * as Assert from '../Assert/Assert.ts'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'
import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'

interface LocationInfo {
  readonly scriptId: number
  readonly line: number
  readonly column: number
  readonly url: string
  readonly sourceMapUrl: string
}

interface ArrayWithLocation {
  readonly name: string
  readonly locationKey: string
  readonly locationInfo: LocationInfo | null
}

interface NameGroup {
  readonly name: string
  readonly count: number
  readonly locations: readonly LocationInfo[]
}

const filterByArray = (value) => {
  return value.nodeName === 'Array'
}

const getValueName = (value) => {
  return value.edgeName || value.nodeName
}

const getArrayNames = (nameMap) => {
  const values = Object.values(nameMap)
  const filtered = values.filter(filterByArray)
  const mapped = filtered.map(getValueName)
  return mapped
}

const getArrayNamesWithCount = (countMap) => {
  const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
    return {
      count: value,
      name: key,
    }
  })
  return arrayNamesWithCount
}

export const getNamedArrayCountFromHeapSnapshot = async (id, scriptMap = {}) => {
  const heapsnapshot = HeapSnapshotState.get(id)

  Assert.object(heapsnapshot)
  const { graph, parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)

  // Get raw array names (for backward compatibility)
  const arrayNames = getArrayNames(nameMap)

  // If we don't have locations data, fall back to simple counting
  if (!heapsnapshot.locations || !heapsnapshot.snapshot?.meta?.location_fields) {
    const countMap = Object.create(null)
    for (const name of arrayNames) {
      countMap[name] ||= 0
      countMap[name]++
    }
    const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
      return {
        name: key,
        count: value,
        locations: [],
      }
    })
    const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
    return sortedArrayNamesWithCount
  }

  // Enhanced version with location information using closures
  const { node_types, node_fields, edge_types, edge_fields, location_fields } = heapsnapshot.snapshot.meta
  const { nodes, edges, strings, locations } = heapsnapshot

  const {
    objectTypeIndex,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    edgeCountFieldIndex,
    edgeToNodeFieldIndex,
    nodeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  const { itemsPerLocation, objectIndexOffset, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(location_fields)

  // Map: closure node ID -> location info
  const closureLocationMap = new Map<number, LocationInfo>()

  // First pass: find all closures and their locations
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    const nodeTypeName = nodeTypes[typeIndex] || ''

    if (nodeTypeName === 'closure') {
      const closureNodeId = nodes[i + idFieldIndex]
      const nodeIndex = i / ITEMS_PER_NODE

      // Find location for this closure
      for (let locIndex = 0; locIndex < locations.length; locIndex += itemsPerLocation) {
        const objectIndex = locations[locIndex + objectIndexOffset] / ITEMS_PER_NODE
        if (objectIndex === nodeIndex) {
          const scriptId = locations[locIndex + scriptIdOffset]
          const line = locations[locIndex + lineOffset]
          const column = locations[locIndex + columnOffset]

          const script = scriptMap[scriptId]
          closureLocationMap.set(closureNodeId, {
            scriptId,
            line,
            column,
            url: script?.url || '',
            sourceMapUrl: script?.sourceMapUrl || '',
          })
          break
        }
      }
    }
  }

  // Map: node ID -> array name
  const nodeIdToNameMap = new Map<number, string>()
  // Map: array node index -> array node ID
  const arrayNodeIndexToIdMap = new Map<number, number>()

  // Second pass: find all arrays and map them to their names
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const name = strings[nameIndex] || ''

      if (name === 'Array') {
        const nodeId = nodes[i + idFieldIndex]
        const nodeIndex = i / ITEMS_PER_NODE
        arrayNodeIndexToIdMap.set(nodeIndex, nodeId)

        // Find the name for this array from nameMap
        const nameMapEntry = nameMap[nodeId]
        if (nameMapEntry) {
          const arrayName = getValueName(nameMapEntry)
          nodeIdToNameMap.set(nodeId, arrayName)
        }
      }
    }
  }

  // Map: closure node ID -> set of node IDs it references (directly or through context)
  const closureReferencesMap = new Map<number, Set<number>>()

  // Third pass: find what closures reference (including through context objects)
  for (const closureNode of parsedNodes) {
    if (closureNode.type === 'closure') {
      const closureId = closureNode.id
      const referencedNodes = new Set<number>()

      // Get edges from this closure
      const closureEdges = graph[closureId] || []
      for (const edge of closureEdges) {
        // Check for context edge
        if (edge.name === 'context') {
          const contextNodeId = parsedNodes[edge.index]?.id
          if (contextNodeId !== undefined) {
            // Get edges from context object
            const contextEdges = graph[contextNodeId] || []
            for (const contextEdge of contextEdges) {
              const targetNodeId = parsedNodes[contextEdge.index]?.id
              if (targetNodeId !== undefined) {
                referencedNodes.add(targetNodeId)
              }
            }
          }
        } else {
          // Direct reference
          const targetNodeId = parsedNodes[edge.index]?.id
          if (targetNodeId !== undefined) {
            referencedNodes.add(targetNodeId)
          }
        }
      }

      if (referencedNodes.size > 0) {
        closureReferencesMap.set(closureId, referencedNodes)
      }
    }
  }

  // Fourth pass: find arrays and connect them to closures
  const arraysWithLocations: ArrayWithLocation[] = []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const name = strings[nameIndex] || ''

      if (name === 'Array') {
        const nodeId = nodes[i + idFieldIndex]
        const arrayName = nodeIdToNameMap.get(nodeId)

        if (arrayName) {
          // Find which closures reference this array
          const closureLocations: LocationInfo[] = []
          for (const [closureId, referencedNodes] of closureReferencesMap.entries()) {
            if (referencedNodes.has(nodeId)) {
              const location = closureLocationMap.get(closureId)
              if (location) {
                // Check if location is already added
                const exists = closureLocations.some(
                  (loc) => loc.scriptId === location.scriptId && loc.line === location.line && loc.column === location.column,
                )
                if (!exists) {
                  closureLocations.push(location)
                }
              }
            }
          }

          // Also check direct edges pointing to this array - if source is a closure
          const nodeIndex = i / ITEMS_PER_NODE
          let currentEdgeOffset = 0
          for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx += ITEMS_PER_NODE) {
            const edgeCount = nodes[nodeIdx + edgeCountFieldIndex]
            for (let j = 0; j < edgeCount; j++) {
              const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
              const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
              if (edgeToNode === nodeIndex) {
                const sourceNodeId = nodes[nodeIdx + idFieldIndex]
                const sourceTypeIndex = nodes[nodeIdx + typeFieldIndex]
                const sourceTypeName = nodeTypes[sourceTypeIndex] || ''
                if (sourceTypeName === 'closure') {
                  const location = closureLocationMap.get(sourceNodeId)
                  if (location) {
                    const exists = closureLocations.some(
                      (loc) => loc.scriptId === location.scriptId && loc.line === location.line && loc.column === location.column,
                    )
                    if (!exists) {
                      closureLocations.push(location)
                    }
                  }
                }
              }
            }
            currentEdgeOffset += edgeCount
          }

          // Create entry for each unique location (or one with 'unknown' if no locations found)
          if (closureLocations.length > 0) {
            for (const location of closureLocations) {
              arraysWithLocations.push({
                name: arrayName,
                locationKey: getLocationKey(location.scriptId, location.line, location.column),
                locationInfo: location,
              })
            }
          } else {
            arraysWithLocations.push({
              name: arrayName,
              locationKey: 'unknown',
              locationInfo: null,
            })
          }
        }
      }
    }
  }

  // Group by name and collect unique locations
  const nameGroupsMap = new Map<string, NameGroup>()

  for (const arrayWithLocation of arraysWithLocations) {
    const existing = nameGroupsMap.get(arrayWithLocation.name)
    if (existing) {
      // Add location if it's unique
      const locationExists = existing.locations.some(
        (loc) =>
          loc.scriptId === arrayWithLocation.locationInfo?.scriptId &&
          loc.line === arrayWithLocation.locationInfo?.line &&
          loc.column === arrayWithLocation.locationInfo?.column,
      )

      const newLocations = locationExists
        ? existing.locations
        : arrayWithLocation.locationInfo
          ? [...existing.locations, arrayWithLocation.locationInfo]
          : existing.locations

      nameGroupsMap.set(arrayWithLocation.name, {
        name: existing.name,
        count: existing.count + 1,
        locations: newLocations,
      })
    } else {
      nameGroupsMap.set(arrayWithLocation.name, {
        name: arrayWithLocation.name,
        count: 1,
        locations: arrayWithLocation.locationInfo ? [arrayWithLocation.locationInfo] : [],
      })
    }
  }

  const result = Array.from(nameGroupsMap.values())
  const sortedResult = SortCountMap.sortCountMap(result)
  return sortedResult
}
