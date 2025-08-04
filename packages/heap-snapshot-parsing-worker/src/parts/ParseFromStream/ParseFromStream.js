import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { HeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 * Parses a heap snapshot file and returns the parsed data with transferable arrays
 * @param {Readable} readStream - Thestream
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const parseFromStream = async (readStream, options) => {
  const writeStream = new HeapSnapshotWriteStream(options)
  await pipeline(readStream, writeStream)
  const { edges, metaData, nodes, locations, strings } = writeStream.getResult()
  const result = {
    metaData,
    nodes,
    edges,
    locations,
    strings: strings,
  }
  return result
}
