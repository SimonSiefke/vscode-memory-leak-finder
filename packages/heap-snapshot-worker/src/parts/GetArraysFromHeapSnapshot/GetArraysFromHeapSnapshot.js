import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { readFile } from 'node:fs/promises'
import { getArraysFromHeapSnapshotInternal } from '../GetArraysFromHeapSnapshotInternal/GetArraysFromHeapSnapshotInternal.js'

export const getArraysFromHeapSnapshot = async (pathUri) => {
  // Read strings and edges from the original JSON file
  const content = await readFile(pathUri, 'utf8')
  const heapSnapshot = JSON.parse(content)
  const strings = heapSnapshot.strings || []
  const edges = new Uint32Array(heapSnapshot.edges || [])

  // Use fast prepareHeapSnapshot
  const { metaData, nodes } = await prepareHeapSnapshot(pathUri)
  const { node_types, node_fields, edge_types, edge_fields } = metaData.data.meta

  return getArraysFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields)
}
