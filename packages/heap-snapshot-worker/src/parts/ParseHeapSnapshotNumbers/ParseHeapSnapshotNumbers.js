import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isNumberNode = (node) => {
  return node.type === 'number'
}

export const parseHeapSnapshotNumbers = (heapsnapshot) => {
  // console.time('parse')
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  // console.timeEnd('parse')
  const numberNodes = parsedNodes.filter(isNumberNode)
  console.log({ numberNodes })
  const id = 6889
  const edges = graph[id]
  console.log({ edges })
  const otherIndex = 54
  const other = parsedNodes[otherIndex]
  console.log({ other })
  const otherId = 109
  const otherEdges = graph[otherId]
  console.log({ otherEdges })

  console.log({ dependendCode: parsedNodes[171], mapCoed: parsedNodes[39] })

  const otherEdges2 = graph[343]
  const otherEdges3 = graph[79]
  console.log({ otherEdges2, otherEdges3 })

  return 123
}
