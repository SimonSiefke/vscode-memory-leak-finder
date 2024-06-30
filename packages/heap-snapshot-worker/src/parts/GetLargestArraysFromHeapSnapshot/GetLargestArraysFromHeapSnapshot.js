import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isArray = (node) => {
  return node.type === 'object' && node.name === 'Array'
}

const getElementCount = (parsedNodes, graph, id) => {
  Assert.array(parsedNodes)
  Assert.object(graph)
  Assert.number(id)
  const edges = graph[id]
  const elementsEdge = edges.find((edge) => edge.name === 'elements')
  if (!elementsEdge) {
    return 0
  }
  const elements = parsedNodes[elementsEdge.index]
  const elementsEdges = graph[elements.id]
  return elementsEdges.length
}

const getArraysWithCount = (parsedNodes, graph, arrayNodes) => {
  const withCount = []
  for (const arrayNode of arrayNodes) {
    const count = getElementCount(parsedNodes, graph, arrayNode.id)
    withCount.push({
      id: arrayNode.id,
      count,
    })
  }
  return withCount
}

const compareCount = (a, b) => {
  return b.count - a.count
}

const sortByLength = (arraysWithLength) => {
  return Arrays.toSorted(arraysWithLength, compareCount)
}

const filterByMinLength = (arrays, minLength) => {
  return arrays.filter((array) => array.count >= minLength)
}

export const getLargestArraysFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const minLength = 100
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const arrayNodes = parsedNodes.filter(isArray)
  const arraysWithLength = getArraysWithCount(parsedNodes, graph, arrayNodes)
  const filtered = filterByMinLength(arraysWithLength, minLength)
  const sorted = sortByLength(filtered)
  return sorted
}
