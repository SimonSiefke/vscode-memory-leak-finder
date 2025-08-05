import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { HeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 * Parses a heap snapshot file and returns the parsed data with transferable arrays
 * @param {Readable} readStream - Thestream
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const parseFromStream = async (readStream) => {
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
