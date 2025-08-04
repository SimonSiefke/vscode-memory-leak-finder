import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { readFile } from 'node:fs/promises'
import { getRegexpObjectsFromHeapSnapshotInternal } from '../GetRegexpObjectsFromHeapSnapshotInternal/GetRegexpObjectsFromHeapSnapshotInternal.js'

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

  return getRegexpObjectsFromHeapSnapshotInternal(strings, nodes, node_types, node_fields)
}
