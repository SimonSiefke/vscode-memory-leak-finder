import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { HeapSnapshotWriteStream } from '../HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

/**
 *
 * @param {string } path
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
    locationFields: metaData.data.meta.location_fields,
  }
}
