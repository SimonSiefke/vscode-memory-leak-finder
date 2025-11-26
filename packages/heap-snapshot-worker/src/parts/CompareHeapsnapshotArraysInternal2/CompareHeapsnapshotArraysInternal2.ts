import * as Assert from '../Assert/Assert.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

const getSortedCounts = (heapsnapshot: Snapshot) => {
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
  // Collect ALL edge names for each array to better differentiate arrays with the same name
  // CreateNameMap processes ALL edge types, not just property edges
  const arrayNamesMap = Object.create(null) // arrayNodeOffset -> Set of edge names
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
          arrayNamesMap[edgeToNode].add(edgeName)
        }
      }
    }
  }

  // Count arrays by joined names (one count per array, not per edge)
  // Join all names with "/" to differentiate arrays with the same name
  const nameMap = Object.create(null)
  for (const arrayOffset of arrayNodeOffsets) {
    const edgeNames = arrayNamesMap[arrayOffset]
    if (edgeNames.size > 0) {
      // Sort names for consistent ordering, then join with "/"
      const sortedNames = Array.from(edgeNames).sort()
      const joinedName = sortedNames.join('/')
      nameMap[joinedName] ||= 0
      nameMap[joinedName]++
    }
  }

  // Convert nameMap to array format and sort
  const arrayNamesWithCount = Object.entries(nameMap).map(([key, value]) => {
    return {
      name: key,
      count: value,
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

export const compareHeapsnapshotArraysInternal2 = async (snapshotA: Snapshot, snapshotB: Snapshot) => {
  Assert.object(snapshotA)
  Assert.object(snapshotB)
  const countsA = getSortedCounts(snapshotA)
  const countsB = getSortedCounts(snapshotB)
  const result = compareCounts(countsA, countsB)
  return result
}
