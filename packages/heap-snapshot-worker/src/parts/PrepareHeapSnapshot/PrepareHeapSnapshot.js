import { HeapSnapshotParsingWorker } from '../HeapSnapshotParsingWorker/HeapSnapshotParsingWorker.js'

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>}
 */
export const prepareHeapSnapshot = async (path) => {
  const parsingWorker = new HeapSnapshotParsingWorker()

  try {
    await parsingWorker.start()
    const result = await parsingWorker.parseHeapSnapshot(path)
    return result
  } finally {
    await parsingWorker.terminate()
  }
}
