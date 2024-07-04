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

export const getNamedEmitterCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const emitterNode = getEventEmitterNode(parsedNodes, graph)
  console.log({ emitterNode })
  if (!emitterNode) {
    throw new Error('no emitter found')
  }
  const emitterNodeIndex = parsedNodes.indexOf(emitterNode)
  const childNodes = parsedNodes.filter((node) => {
    const edges = graph[node.id]
    return edges.some((edge) => edge.index === emitterNodeIndex)
  })
  console.log({ childNodes })
  const randomNode = parsedNodes.find((node) => node.id === 276279)
  console.log({ randomNode })
  const randomEdges = graph[randomNode.id]
  console.log({ randomEdges })
  const randomEdgeProto = randomEdges.find((edge) => edge.name === '__proto__')
  console.log({ randomEdgeProto })
  const protoNode = parsedNodes[randomEdgeProto.index]
  console.log({ protoNode })
  // const firstEdge = edges[0]
  // const node = parsedNodes[39]
  // const mapEdges = graph[node.id]
  // console.log({ mapEdges })
  return parsedNodes
}
