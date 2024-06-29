import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

const isClosure = node=>{
  return node.type==='closure'
}

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const closureNodes = parsedNodes.filter(isClosure)
  return {
    closureNodes,
    graph,
  }
}
