import * as Assert from '../Assert/Assert.js'

const ITEMS_PER_NODE = 7

export const getNamedArrayCountFromHeapSnapshot = (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { snapshot, nodes, strings } = heapsnapshot
  const { meta } = snapshot
  const { node_types } = meta
  const arrayIndex = node_types[0].indexOf('array')
  const arrayCountMap = Object.create(null)
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    const nameIndex = nodes[i + 1]
    if (typeIndex === arrayIndex) {
      const name = strings[nameIndex]
      arrayCountMap[name] ||= 0
      arrayCountMap[name]++
    }
  }
  return arrayCountMap
}
