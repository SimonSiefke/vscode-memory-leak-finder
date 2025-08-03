import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { readFile } from 'node:fs/promises'

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  // Read strings from the original JSON file
  const content = await readFile(pathUri, 'utf8')
  const heapSnapshot = JSON.parse(content)
  const strings = heapSnapshot.strings || []

  // Use fast prepareHeapSnapshot
  const { metaData, nodes } = await prepareHeapSnapshot(pathUri)
  const { node_types, node_fields } = metaData.data.meta

  const regexpTypeIndex = node_types[0].indexOf('regexp')
  const ITEMS_PER_NODE = node_fields.length

  if (regexpTypeIndex === -1) {
    return []
  }

  const regexpObjects = []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + node_fields.indexOf('type')]
    if (typeIndex === regexpTypeIndex) {
      const nameIndex = nodes[i + node_fields.indexOf('name')]
      const id = nodes[i + node_fields.indexOf('id')]
      const selfSize = nodes[i + node_fields.indexOf('self_size')]
      const edgeCount = nodes[i + node_fields.indexOf('edge_count')]
      const detachedness = nodes[i + node_fields.indexOf('detachedness')]

      const pattern = strings[nameIndex] || ''

      regexpObjects.push({
        id,
        name: pattern,
        pattern,
        selfSize,
        edgeCount,
        traceNodeId: 0, // Not available in this heap snapshot format
        detachedness,
      })
    }
  }

  return regexpObjects
}
