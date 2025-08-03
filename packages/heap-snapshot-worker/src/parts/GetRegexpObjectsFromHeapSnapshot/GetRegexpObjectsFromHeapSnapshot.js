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

  // Calculate field indices once
  const typeFieldIndex = node_fields.indexOf('type')
  const nameFieldIndex = node_fields.indexOf('name')
  const idFieldIndex = node_fields.indexOf('id')

  if (regexpTypeIndex === -1) {
    return []
  }

  const regexpObjects = []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === regexpTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const id = nodes[i + idFieldIndex]
      const pattern = strings[nameIndex] || ''

      regexpObjects.push({
        id,
        pattern,
      })
    }
  }

  return regexpObjects
}
