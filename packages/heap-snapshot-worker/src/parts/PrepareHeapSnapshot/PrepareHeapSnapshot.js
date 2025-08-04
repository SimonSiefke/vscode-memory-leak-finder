import { HeapSnapshotParsingWorker } from '../HeapSnapshotParsingWorker/HeapSnapshotParsingWorker.js'

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @param {boolean} parseStrings - Whether to parse and return strings
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array, strings: string[]}>}
 */
export const prepareHeapSnapshot = async (path, parseStrings = false) => {
  const overallStartTime = performance.now()
  console.log(`[PrepareHeapSnapshot] Starting heap snapshot preparation for: ${path} (parseStrings: ${parseStrings})`)

  const parsingWorker = new HeapSnapshotParsingWorker()

  try {
    const workerStartTime = performance.now()
    console.log(`[PrepareHeapSnapshot] Starting parsing worker...`)
    await parsingWorker.start()
    const workerStarted = performance.now()
    console.log(`[PrepareHeapSnapshot] Worker started in ${(workerStarted - workerStartTime).toFixed(2)}ms`)

    const result = await parsingWorker.parseHeapSnapshot(path, parseStrings)

    const parseCompleted = performance.now()
    console.log(`[PrepareHeapSnapshot] Total parsing workflow completed in ${(parseCompleted - overallStartTime).toFixed(2)}ms`)

    return result
  } finally {
    const terminateStart = performance.now()
    await parsingWorker[Symbol.asyncDispose]()
    const terminateEnd = performance.now()
    console.log(`[PrepareHeapSnapshot] Worker terminated in ${(terminateEnd - terminateStart).toFixed(2)}ms`)

    const totalTime = performance.now() - overallStartTime
    console.log(`[PrepareHeapSnapshot] Total time including cleanup: ${totalTime.toFixed(2)}ms`)
  }
}
