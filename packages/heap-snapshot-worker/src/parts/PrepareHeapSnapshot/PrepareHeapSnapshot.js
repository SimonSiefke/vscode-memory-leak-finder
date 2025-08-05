import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.js'
import { waitForResult } from '../WaitForResult/WaitForResult.js'

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>}
 */
export const prepareHeapSnapshot = async (path) => {
  const workerPath = getHeapSnapshotWorkerPath()
  const worker = new Worker(workerPath)

  try {
    // Create the result promise (sets up event listeners)
    const resultPromise = waitForResult(worker)

    // Send the parsing command
    worker.postMessage({
      method: 'HeapSnapshot.parse',
      params: [path],
    })

    // Wait for the result
    return await resultPromise
  } finally {
    // Always terminate the worker
    await worker.terminate()
  }
}
