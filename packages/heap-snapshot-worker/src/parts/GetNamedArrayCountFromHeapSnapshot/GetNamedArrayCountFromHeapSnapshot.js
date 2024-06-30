import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as SortCountMap from '../SortCountMap/SortCountMap.js'

const createCountMap = (names) => {
  const map = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
}

const createNameMap = (parsedNodes, graph) => {
  const nameMap = Object.create(null)
  for (const node of parsedNodes) {
    const edges = graph[node.id]
    for (const edge of edges) {
      const toNode = parsedNodes[edge.index]
      nameMap[toNode.id] ||= {
        edgeName: edge.name,
        nodeName: toNode.name,
      }
    }
  }
  return nameMap
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

const createFinalMap = (sortedItems) => {
  const map = Object.create(null)
  for (const item of sortedItems) {
    map[item.name] = item.count
  }
  return map
}

export const getNamedArrayCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const nameMap = createNameMap(parsedNodes, graph)
  const arrayNames = getArrayNames(nameMap)
  const countMap = createCountMap(arrayNames)
  const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  const map = createFinalMap(sortedArrayNamesWithCount)
  return map
}
