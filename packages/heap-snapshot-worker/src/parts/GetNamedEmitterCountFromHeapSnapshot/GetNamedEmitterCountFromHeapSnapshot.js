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

const isEventEmitterConstructorCandidate = (node) => {
  return node.type === 'object' && node.name === 'Emitter'
}

const getEventEmitterNode = (nodes, graph) => {
  const candidates = nodes.filter(isEventEmitterConstructorCandidate)
  const allEdges = Object.values(graph).flat(1)
  const explorerRootEdge = allEdges.find((edge) => edge.name === 'explorerRootErrorEmitter')
  for (const candidate of candidates) {
    const index = nodes.indexOf(candidate)
    if (explorerRootEdge.index === index) {
      return candidate
    }
  }
  return undefined
}

const RE_NUMERIC = /^\d+$/

const isRelevantEdge = (edge) => {
  const { name } = edge
  if (name === 'this') {
    return false
  }
  if (RE_NUMERIC.test(name)) {
    return false
  }
  return true
}

const createCountedValues = (names) => {
  const countMap = Object.create(null)
  for (const name of names) {
    countMap[name] ||= 0
    countMap[name]++
  }
  const entries = Object.entries(countMap)
  const result = entries.map(([key, value]) => {
    return {
      name: key,
      count: value,
    }
  })
  return result
}

export const getNamedEmitterCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const emitters = parsedNodes.filter(isEventEmitterConstructorCandidate)
  const allEdges = Object.values(graph).flat(1)
  const allValues = []
  const indices = emitters.map((emitter) => {
    return parsedNodes.indexOf(emitter)
  })
  const indicesSet = new Set(indices)
  const reverseMap = Object.create(null)
  for (const edge of allEdges) {
    if (indicesSet.has(edge.index)) {
      reverseMap[edge.index] ||= []
      reverseMap[edge.index].push(edge)
    }
  }
  for (const item of emitters) {
    const index = parsedNodes.indexOf(item)
    const matchingEdges = reverseMap[index] || []
    const relevantEdge = matchingEdges.find(isRelevantEdge)
    if (!relevantEdge) {
      continue
    }
    allValues.push(relevantEdge.name)
  }
  const countedValues = createCountedValues(allValues)
  return countedValues
}
