import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isClosure = (node) => {
  return node.type === 'closure'
}

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closureNodes = parsedNodes.filter(isClosure)
  // const closureChildren = closureNodes.flatMap((node) => {
  //   const edges = graph[node.id]
  //   return edges.map((edge) => {
  //     return parsedNodes[edge]
  //   })
  // })
  // for (const closureNode of closureNodes) {
  // }
  const interesting = closureNodes.find((item) => item.name === 'IpcChildWithModuleWorker')
  // const
  const other = parsedNodes[204218]
  console.log({ other, len: parsedNodes.length })
  const items = graph[interesting.id]
  return {
    interesting,
    // graph,
    items,
  }
}
