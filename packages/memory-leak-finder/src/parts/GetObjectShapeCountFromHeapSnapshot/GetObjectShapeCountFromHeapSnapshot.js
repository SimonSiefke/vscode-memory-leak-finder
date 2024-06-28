import * as Assert from '../Assert/Assert.js'

const ITEMS_PER_NODE = 7

export const getObjectShapeCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { snapshot, nodes } = heapsnapshot
  const { meta } = snapshot
  const { node_types } = meta
  const objectShapeIndex = node_types[0].indexOf('object shape')
  const nodesArray = new Uint32Array(nodes)
  let count = 0
  for (let i = 0; i < nodesArray.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    if (typeIndex === objectShapeIndex) {
      count++
    }
  }
  return count
}
