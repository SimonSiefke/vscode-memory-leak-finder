import * as Assert from '../Assert/Assert.js'

const ITEMS_PER_NODE = 7
const ITEMS_PER_EDGE = 3

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { snapshot, nodes, edges, strings } = heapsnapshot
  const { meta } = snapshot
  const { node_types } = meta
  const arrayIndex = node_types[0].indexOf('array')
  const closureIndex = node_types[0].indexOf('closure')
  const arrayCountMap = Object.create(null)
  const nodesArray = new Uint32Array(nodes)
  const edgesArray = new Uint32Array(edges)
  let edgeIndex = 0
  const nodeMap = Object.create(null)
  for (let i = 0; i < nodesArray.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    const nameIndex = nodes[i + 1]
    const idIndex = node_types[i + 2]
    const edgeCount = nodes[i + 4]
    if (typeIndex === closureIndex) {
    } else if (typeIndex === arrayIndex) {
    }

    if (typeIndex === closureIndex) {
      const closureName = strings[nameIndex]
      arrayCountMap[closureName]
      const itemSize = edgeCount * ITEMS_PER_EDGE
      for (let j = 0; j < itemSize; j += ITEMS_PER_EDGE) {
        const edgeType = edgesArray[j]
        const nameOrIndex = edgesArray[j + 1]
        const toNodeIndex = edgesArray[j + 2]
        const connectedNodeType = nodesArray[toNodeIndex]
        const connectedNodeNameIndex = nodesArray[toNodeIndex + 1]
        if (connectedNodeType === arrayIndex) {
          const connectedNodeName = strings[connectedNodeNameIndex]
          const edgeName = strings[nameIndex]
          arrayCountMap[edgeName] ||= 0
          arrayCountMap[edgeName]++
        }
      }
    }
    edgeIndex += edgeCount
  }
  return arrayCountMap
}
