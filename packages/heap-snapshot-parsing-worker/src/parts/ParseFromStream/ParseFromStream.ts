import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createHeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 * Parses a heap snapshot file and returns the parsed data with transferable arrays
 * @param {Readable} readStream - The stream to read from
 * @param {Object} [options={ parseStrings: false }] - Options for parsing
 * @param {boolean} [options.parseStrings=false] - Whether to parse and return strings
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array, strings: string[]}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const parseFromStream = async (readStream, options = { parseStrings: false }) => {
  const writeStream = createHeapSnapshotWriteStream(options)
  await pipeline(readStream, writeStream)
  const { edges, metaData, nodes, locations, strings } = writeStream.getResult()
  const result = {
    metaData,
    nodes,
    edges,
    locations,
    strings,
  }
  return result
}
