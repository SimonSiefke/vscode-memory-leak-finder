import * as Assert from '../Assert/Assert.js'
import * as GetConstructorScope from '../GetConstructorScope/GetConstructorScope.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as GetConstructorScopeMap from '../GetConstructorScopeMap/GetConstructorScopeMap.js'
import * as GetConstructorNodes from '../GetConstructorNodes/GetConstructorNodes.js'

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

const anonymousEdge = {
  index: -1,
  name: '<anonymous>',
}

const createNamesMap = (parsedNodes, graph) => {
  const namesMap = Object.create(null)
  const allEdges = Object.values(graph).flat(1)
  for (const edge of allEdges) {
    namesMap[edge.index] ||= []
    namesMap[edge.index].push(edge.name)
  }
  const namesIdMap = Object.create(null)
  for (let i = 0; i < parsedNodes.length; i++) {
    const node = parsedNodes[i]
    namesIdMap[node.id] = namesMap[i] || []
    namesIdMap[node.id].unshift(node.name)
  }
  return namesIdMap
}

const isIgnoredEdge = (edge) => {
  return edge.name === 'this' || edge.name === 'bound_this'
}

const getConstructorScope = (parsedNodes, graph, node) => {
  const nodeIndex = parsedNodes.indexOf(node)
  for (const parsedNode of parsedNodes) {
    const edges = graph[parsedNode.id]
    for (const edge of edges) {
      if (edge.index === nodeIndex) {
        if (isIgnoredEdge(edge)) {
          continue
        }
        return parsedNode
      }
    }
  }
  return undefined
}

export const getNamedEmitterCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const constructorName = 'Emitter'
  const emitterNodes = GetConstructorNodes.getConstructorNodes(parsedNodes, constructorName)
  const constructorScopeMap = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const emitterNodesWithInfo = emitterNodes.map((node) => {
    const constructorScope = GetConstructorScope.getConstructorScope(parsedNodes, constructorScopeMap, node)
    return {
      ...node,
      constructorScope,
    }
  })
  // // console.log({ namesIdMap })
  // const emitters = parsedNodes.filter(isEventEmitterConstructorCandidate)
  // const allValues = []
  // const indices = emitters.map((emitter) => {
  //   return parsedNodes.indexOf(emitter)
  // })
  // const indicesSet = new Set(indices)
  // const reverseMap = Object.create(null)
  // for (const edge of allEdges) {
  //   if (indicesSet.has(edge.index)) {
  //     reverseMap[edge.index] ||= []
  //     reverseMap[edge.index].push(edge)
  //   }
  // }
  // for (const item of emitters) {
  //   const index = parsedNodes.indexOf(item)
  //   const matchingEdges = reverseMap[index] || []
  //   const relevantEdge = matchingEdges.find(isRelevantEdge) || anonymousEdge
  //   console.log({ relevantEdge })
  //   allValues.push(relevantEdge.name)
  //   const relevantEdgeNode = parsedNodes[relevantEdge.index]
  //   const relevantThisEdge = matchingEdges.find((edge) => edge.name === 'this')
  //   if (relevantThisEdge) {
  //     const relevantThisNode = parsedNodes[relevantThisEdge.index]
  //     const relevantThisNodeEdges = graph[relevantThisNode.id]

  //     console.log({ relevantEdge, relevantEdgeNode, matchingEdges, relevantThisNode, relevantThisNodeEdges })
  //   }
  // }
  // const countedValues = createCountedValues(allValues)
  return {
    // namesIdMap,
    emitterNodesWithInfo,
  }
}
