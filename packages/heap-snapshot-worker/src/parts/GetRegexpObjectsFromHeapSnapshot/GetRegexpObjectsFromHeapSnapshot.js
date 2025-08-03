import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { readFile } from 'node:fs/promises'

const ITEMS_PER_NODE = 7

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  // Read and parse the heap snapshot file to get strings
  const content = await readFile(pathUri, 'utf8')
  const heapSnapshot = JSON.parse(content)
  const strings = heapSnapshot.strings || []

  // Use prepareHeapSnapshot for fast node parsing
  const { metaData, nodes } = await prepareHeapSnapshot(pathUri)

  const { node_types, node_fields } = metaData.data.meta
  const regexpTypeIndex = node_types[0].indexOf('regexp')

  if (regexpTypeIndex === -1) {
    return []
  }

  const regexpObjects = []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    if (typeIndex === regexpTypeIndex) {
      const nameIndex = nodes[i + 1]
      const id = nodes[i + 2]
      const selfSize = nodes[i + 3]
      const edgeCount = nodes[i + 4]
      const traceNodeId = nodes[i + 5]
      const detachedness = nodes[i + 6]

      const regexPattern = strings[nameIndex] || ''

      regexpObjects.push({
        id,
        name: regexPattern,
        pattern: regexPattern,
        selfSize,
        edgeCount,
        traceNodeId,
        detachedness,
      })
    }
  }

  return regexpObjects
}
