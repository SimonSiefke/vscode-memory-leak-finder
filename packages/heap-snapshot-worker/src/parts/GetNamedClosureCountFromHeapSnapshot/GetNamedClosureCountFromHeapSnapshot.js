import * as Assert from '../Assert/Assert.js'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.js'
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

const isClosure = (node) => {
  return node.type === 'closure'
}

const isImportantEdge = (edge) => {
  const { name } = edge
  switch (name) {
    case '__proto__':
    case 'feedback_cell':
    case 'shared':
    case 'context':
    case 'code':
    case 'map':
      return false
    default:
      return true
  }
}

const isContext = (edge) => {
  return edge.name === 'context'
}

export const getNamedClosureCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closures = parsedNodes.filter(isClosure)
  const mapped = closures.map((node) => {
    const edges = graph[node.id]
    const contextEdge = edges.find(isContext)
    if (!contextEdge) {
      return node
    }
    const contextNode = parsedNodes[contextEdge.index]
    const contextNodeEdges = graph[contextNode.id]
    return {
      ...node,
      contextNodeEdges,
    }
  })
  // const first = closures[0]
  // const edges = graph[first.id]
  // console.log({ first, edges })
  // const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  // const arrayNames = getArrayNames(nameMap)
  // const countMap = createCountMap(arrayNames)
  // const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  // const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  // const map = createFinalMap(sortedArrayNamesWithCount)
  return mapped
}
