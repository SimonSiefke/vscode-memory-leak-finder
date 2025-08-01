import { createReadStream } from 'node:fs'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

const ITEMS_PER_NODE = 7

/**
 * @param {string} path
 * @returns {Promise<number>}
 */
export const getObjectShapeCountFromHeapSnapshot2 = async (path) => {
  const readStream = createReadStream(path)
  const { metaData, nodes } = await prepareHeapSnapshot(readStream)

  const { node_types } = metaData.data.meta
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