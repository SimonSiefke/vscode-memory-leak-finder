import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { HeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 * Parses a heap snapshot file and returns the parsed data with transferable arrays
 * @param {string} path - The file path to the heap snapshot
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const prepareHeapSnapshot = async (path) => {
  const readStream = createReadStream(path)
  const writeStream = new HeapSnapshotWriteStream()
  await pipeline(readStream, writeStream)
  const { edges, metaData, nodes, locations } = writeStream.getResult()

  return {
    metaData,
    nodes,
    edges,
    locations,
  }
}
