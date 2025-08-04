import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createHeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 * Parses a heap snapshot file and returns the parsed data with transferable arrays
 * @param {string} path - The file path to the heap snapshot
 * @param {Object} options - Options for parsing
 * @param {boolean} options.parseStrings - Whether to parse and return strings
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array, strings: string[]}>} Promise containing parsed heap snapshot data with transferable arrays
 */
export const parseFromFile = async (path, options = {}) => {
  const readStream = createReadStream(path)
  const writeStream = createHeapSnapshotWriteStream(options)
  await pipeline(readStream, writeStream)
  const result = writeStream.getResult()
  return result
}
