import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const ITEMS_PER_NODE = 7

/**
 * @param {string} path
 * @returns {Promise<number>}
 */
export const getObjectShapeCountFromHeapSnapshot2 = async (path) => {
  const { meta, nodes } = await prepareHeapSnapshot(path, {})

  const { node_types } = meta
  const objectShapeIndex = node_types[0].indexOf('object shape')

  let count = 0
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    if (typeIndex === objectShapeIndex) {
      count++
    }
  }

  return count
}
