import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  return {
    // parsedNodes,
    graph,
  }
}
