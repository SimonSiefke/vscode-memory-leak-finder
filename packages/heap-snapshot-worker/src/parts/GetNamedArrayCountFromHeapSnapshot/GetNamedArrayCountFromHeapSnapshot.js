import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isClosure = (node) => {
  return node.type === 'closure'
}

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  // const closureNodes = parsedNodes.filter(isClosure)
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
  const nameMap = Object.create(null)
  for (let i = 0; i < parsedNodes.length; i++) {
    // const node = parsedNodes[i]
    // // console.log({ node })
    // if (node.type !== 'array') {
    //   continue
    // }
    // console.log({ node })
    // for (const [key, value] of Object.entries(graph)) {
    //   if (value.includes(i)) {
    //     console.log({ key })
    //   }
    // }
  }
  // const interesting = parsedNodes.find((item) => item.type === 'object' && item.name === 'Ipc')
  // console.log({ interesting })
  // // const
  // const edges = graph[interesting.id]
  // const firstEdge = edges[0]
  // // console.log({ firstEdge })
  // const other = parsedNodes[firstEdge]
  // // console.log({ other, len: parsedNodes.length })
  // const items = edges.map((edge) => parsedNodes[edge])
  //  graph[interesting.id]
  // console.log({ items })
  return {
    // interesting,
    // graph,
    // items,
  }
}
