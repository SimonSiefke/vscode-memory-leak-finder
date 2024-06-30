import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isClosure = (node) => {
  return node.type === 'closure'
}

const createCountMap = (names) => {
  const map = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
}

export const getNamedArrayCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closureNodes = parsedNodes.filter(isClosure)
  const closureEdges = closureNodes.flatMap((node) => graph[node.id])
  const closureEdgesToArrays = closureEdges.filter((edge) => {
    const node = parsedNodes[edge.index]
    return node.type === 'object' && node.name === 'Array'
  })
  const arrayNames = closureEdgesToArrays.map((edge) => edge.name)
  const map = createCountMap(arrayNames)
  return map
}
