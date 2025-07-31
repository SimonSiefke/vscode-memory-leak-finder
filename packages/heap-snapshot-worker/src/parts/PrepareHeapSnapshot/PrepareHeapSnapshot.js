import { ReadStream } from 'fs'
import { pipeline } from 'node:stream/promises'
import { HeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 *
 * @param {ReadStream} readStream
 */
export const prepareHeapSnapshot = async (readStream) => {
  const writeStream = new HeapSnapshotWriteStream()
  await pipeline(readStream, writeStream)
  const { edges, metaData, nodes } = writeStream.getResult()
  return {
    metaData,
    nodes,
    edges,
  }
}
