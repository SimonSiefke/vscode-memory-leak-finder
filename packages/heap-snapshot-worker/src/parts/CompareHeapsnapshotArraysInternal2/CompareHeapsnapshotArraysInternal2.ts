import * as Assert from '../Assert/Assert.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

const createCountMap = (names) => {
  const map = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
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
      name: key,
      count: value,
    }
  })
  return arrayNamesWithCount
}

const getSortedCounts = (heapsnapshot: Snapshot) => {
  const { nodes: nodesRaw, edges: edgesRaw, strings } = heapsnapshot
  const meta = heapsnapshot.meta
  const { node_fields, edge_fields, edge_types } = meta

  // Convert to Uint32Array if needed
  const nodes = nodesRaw instanceof Uint32Array ? nodesRaw : new Uint32Array(nodesRaw)
  const edges = edgesRaw instanceof Uint32Array ? edgesRaw : new Uint32Array(edgesRaw)

  const nodeFieldCount = node_fields.length
  const edgeFieldCount = edge_fields.length
  const nameFieldIndex = node_fields.indexOf('name')
  const typeFieldIndex = node_fields.indexOf('type')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')
  const edgeTypes = edge_types[0] || []
  const edgeTypeProperty = edgeTypes.indexOf('property')
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

  // Second pass: scan all edges to find property edges pointing TO array nodes
  const nameMap = Object.create(null)
  const edgeMap = createEdgeMap(nodes, node_fields)

  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += nodeFieldCount) {
    const nodeIndex = nodeOffset / nodeFieldCount
    const edgeCount = nodes[nodeOffset + edgeCountFieldIndex]
    const edgeStartIndex = edgeMap[nodeIndex]

    // Scan edges from this node
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (edgeStartIndex + j) * edgeFieldCount
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this is a property edge pointing to an array node
      // edgeToNode is a byte offset in the nodes array
      if (edgeType === edgeTypeProperty && arrayNodeOffsets.has(edgeToNode)) {
        const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeName = strings[edgeNameIndex] || ''
        // Filter out internal properties
        if (
          edgeName &&
          edgeName !== 'constructor' &&
          edgeName !== '__proto__' &&
          edgeName !== 'prototype' &&
          !edgeName.startsWith('<symbol')
        ) {
          nameMap[edgeName] ||= 0
          nameMap[edgeName]++
        }
      }
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
