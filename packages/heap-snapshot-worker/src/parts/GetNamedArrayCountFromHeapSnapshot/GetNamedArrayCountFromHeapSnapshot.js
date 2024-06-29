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
  console.log({ closureEdges })
  const closureEdgesToArrays = closureEdges.filter((edge) => {
    const node = parsedNodes[edge.index]
    return node.type === 'object' && node.name === 'Array'
  })
  const arrayNames = closureEdgesToArrays.map((edge) => edge.name)
  const map = createCountMap(arrayNames)
  // const closureChildren = closureNodes.flatMap((node) => {
  //   const edges = graph[node.id]
  //   return edges.map((edge) => {
  //     return parsedNodes[edge]
  //   })
  // })
  // const arrays = closureChildren.filter((item) => item.type === 'array')
  // console.log({ arrays })
  // for (const closureNode of closureNodes) {
  // }
  // console.log({ parsedNodes })
  // const nameMap = Object.create(null)
  // for (let i = 0; i < parsedNodes.length; i++) {
  //   // const node = parsedNodes[i]
  //   // // console.log({ node })
  //   // if (node.type !== 'array') {
  //   //   continue
  //   // }
  //   // console.log({ node })
  //   // for (const [key, value] of Object.entries(graph)) {
  //   //   if (value.includes(i)) {
  //   //     console.log({ key })
  //   //   }
  //   // }
  // }
  const interesting = parsedNodes.find((node) => node.id === 864391)
  const edges = graph[interesting.id]
  // const connected = edges.map((edge) => parsedNodes[edge])

  // const related = parsedNodes.find((a) => a.id === 1168725)
  // const related2 = parsedNodes.find((a) => a.id === 1168727)
  // const related2Edges = graph[related2.id]
  // const related2Nodes = related2Edges.map((edge) => parsedNodes[edge])
  // const interesting = parsedNodes.find((item) => item.type === 'object' && item.name === 'Ipc')
  // console.log({ interesting })
  // // const
  // const firstEdge = edges[0]
  // // console.log({ firstEdge })
  // const other = parsedNodes[firstEdge]
  // // console.log({ other, len: parsedNodes.length })
  // const items = edges.map((edge) => parsedNodes[edge])
  //  graph[interesting.id]
  // console.log({ items })
  const a = parsedNodes[584367]
  return {
    // parsedNodes,
    map,
    // connected,
    // related,
    // related2,
    // related2Nodes,
    // graph,
    // items,
  }
}