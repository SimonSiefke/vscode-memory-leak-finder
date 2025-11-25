import * as Assert from '../Assert/Assert.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
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

const getSortedCounts = (heapsnapshot) => {
  const edgeMap = createEdgeMap(heapsnapshot.nodes, heapsnapshot.meta.node_fields)
  const nodeFieldCount = heapsnapshot.meta.node_fields.length
  const nameMetaIndex = heapsnapshot.meta.node_fields.indexOf('name')
  const edgeNameMetaIndex = heapsnapshot.meta.edge_fields.indexOf('name')
  const edgeFieldCount = heapsnapshot.meta.edge_fields.length
  const edgeCountFieldIndex = heapsnapshot.meta.node_fields.indexOf('edge_count')
  const edgeCountTypeIndex = heapsnapshot.meta.edge_fields.indexOf('type')
  const edgeTypeMetaElement = heapsnapshot.meta.edge_types[0].indexOf('element')

  let arrayCount = 0
  const nameMap = Object.create(null)
  const { nodes, strings, edges } = heapsnapshot

  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const nameIndex = nodes[i + nameMetaIndex]
    const name = strings[nameIndex]
    if (name === 'Array') {
      const edgeCount = nodes[i + edgeCountFieldIndex]
      const edgeIndexBase = edgeMap[i / nodeFieldCount]
      for (let j = 0; j < edgeCount; j++) {
        const edgeIndex = edgeIndexBase + j * edgeFieldCount
        const edgeType = edges[edgeIndex + edgeCountTypeIndex]
        if (edgeType === edgeTypeMetaElement) {
          const edgeNameIndex = edges[edgeIndex + edgeNameMetaIndex]
          const edgeName = strings[edgeNameIndex]
          nameMap[edgeName] ||= 0
          nameMap[edgeName]++
          break
        }
      }
      arrayCount++
    }
  }
  return []
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

export const compareHeapsnapshotArraysInternal2 = async (snapshotA: any, snapshotB: any) => {
  Assert.object(snapshotA)
  Assert.object(snapshotB)
  const countsA = getSortedCounts(snapshotA)
  const countsB = getSortedCounts(snapshotB)
  const result = compareCounts(countsA, countsB)
  return result
}
