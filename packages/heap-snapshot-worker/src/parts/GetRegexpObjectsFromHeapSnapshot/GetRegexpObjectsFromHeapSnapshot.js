import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

const ITEMS_PER_NODE = 7

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  const { metaData, nodes } = await prepareHeapSnapshot(pathUri)

  const { node_types, node_fields } = metaData.data.meta
  const regexpTypeIndex = node_types[0].indexOf('regexp')
  
  if (regexpTypeIndex === -1) {
    return []
  }

  const regexpObjects = []
  
  // Get strings for name resolution
  const strings = metaData.data.strings || []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    if (typeIndex === regexpTypeIndex) {
      const nameIndex = nodes[i + 1]
      const id = nodes[i + 2]
      const selfSize = nodes[i + 3]
      const edgeCount = nodes[i + 4]
      const traceNodeId = nodes[i + 5]
      const detachedness = nodes[i + 6]
      
      regexpObjects.push({
        id,
        name: strings[nameIndex] || '',
        selfSize,
        edgeCount,
        traceNodeId,
        detachedness,
      })
    }
  }

  return regexpObjects
}