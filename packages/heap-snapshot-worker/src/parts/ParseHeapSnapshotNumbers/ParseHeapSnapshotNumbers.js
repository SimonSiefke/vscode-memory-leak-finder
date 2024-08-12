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

  return 123
}
