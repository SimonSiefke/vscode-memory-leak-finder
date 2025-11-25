import * as Assert from '../Assert/Assert.ts'
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
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  const arrayNames = getArrayNames(nameMap)
  const countMap = createCountMap(arrayNames)
  const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  return sortedArrayNamesWithCount
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
