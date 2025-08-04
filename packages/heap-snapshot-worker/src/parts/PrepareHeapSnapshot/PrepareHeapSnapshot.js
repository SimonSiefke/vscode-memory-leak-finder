import { HeapSnapshotParsingWorker } from '../HeapSnapshotParsingWorker/HeapSnapshotParsingWorker.js'

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @param {boolean} parseStrings - Whether to parse and return strings
 * @returns {Promise<{metaData: any, nodes: Uint32Array<ArrayBuffer>, edges: Uint32Array<ArrayBuffer>, locations: Uint32Array<ArrayBuffer>, strings: string[]}>}
 */
export const prepareHeapSnapshot = async (path, parseStrings) => {
  const parsingWorker = new HeapSnapshotParsingWorker()
  try {
    await parsingWorker.start()
    const result = await parsingWorker.parseHeapSnapshot(path, parseStrings)
    return result
  } finally {
    await parsingWorker[Symbol.asyncDispose]()
  }
}
